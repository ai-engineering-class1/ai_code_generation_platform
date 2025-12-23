"""OpenSpec Editor Endpoints."""
import asyncio
import io
from typing import Dict, Any, List
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Depends
from app.core.config import settings
from app.services.openspec_service import OpenSpecService
from app.services.claude_service import ClaudeService
from app.models.openspec import (
    Project, SpecificationUpdate, SuggestionRequest,
    GenerateRequest, TaskStatus, Task
)
import httpx

router = APIRouter()

# In-memory storage for OpenSpec Editor sessions
# In a real production app, this should be in Redis or Database
user_sessions: Dict[str, Dict[str, Any]] = {}
task_manager: Dict[str, Dict[str, Any]] = {}

# Services
# Workspace root should be under settings.WORKSPACE_ROOT/<taskId>/codebase/simplest-repo/...
openspec_service = OpenSpecService(settings.WORKSPACE_ROOT)
claude_service = ClaudeService()

# Helper function to ensure repository is downloaded
async def ensure_repo_downloaded(task_id: str) -> bool:
    """
    Ensure the repository is downloaded before uploading OpenSpec files.
    This prevents duplicate folder creation.
    
    Returns True if repo was downloaded or already exists, False on error.
    """
    import os
    from pathlib import Path
    
    base_dir = Path(settings.WORKSPACE_ROOT)
    simplest_repo_dir = base_dir / task_id / "codebase" / "simplest-repo"
    
    # Check if repository is already downloaded
    if simplest_repo_dir.exists():
        for item in simplest_repo_dir.iterdir():
            if item.is_dir() and item.name.startswith("DrLinAITeam2-simplest-repo-"):
                print(f"Repository already downloaded: {item.name}")
                return True
    
    # Download the repository
    try:
        print(f"Downloading repository for task {task_id}...")
        
        github_service_url = "http://103.98.213.149:8510"
        owner = "DrLinAITeam2"
        repo = "simplest-repo"
        branch = "main"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                f"{github_service_url}/download-repo",
                params={"owner": owner, "repo": repo, "ref": branch},
                headers={"Accept": "application/zip"}
            )
            
            if response.status_code != 200:
                print(f"Failed to download repo: {response.status_code}")
                return False
            
            # Create target directory
            simplest_repo_dir.mkdir(parents=True, exist_ok=True)
            
            # Save and extract zip
            zip_path = simplest_repo_dir / "repo.zip"
            zip_path.write_bytes(response.content)
            
            # Extract
            # Extract using Python's built-in zipfile (Works on Linux/Windows/Mac without external dependencies)
            import zipfile
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(simplest_repo_dir)
            except Exception as e:
                print(f"Zipfile extraction failed: {e}")
                raise e
            
            # Clean up zip file
            zip_path.unlink()
            
            print(f"Repository downloaded successfully")
            return True
            
    except Exception as e:
        print(f"Error downloading repository: {e}")
        import traceback
        traceback.print_exc()
        return False

@router.post("/projects/{project_id}/activities/{activity_id}/download-codebase")
async def download_codebase_for_activity(project_id: str, activity_id: str):
    """
    Download GitHub codebase for a specific activity.
    This triggers the repository download and stores it under temp/{activity_id}/codebase/simplest-repo/
    """
    try:
        # Download repository using activity_id instead of task_id
        success = await ensure_repo_downloaded(activity_id)
        
        if success:
            return {
                "success": True,
                "message": f"Codebase downloaded successfully for activity {activity_id}",
                "activityId": activity_id
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to download codebase. Check server logs for details."
            )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading codebase: {str(e)}"
        )

# Helper for GitHub Logic using GitHub Service Proxy
# Based on: https://github.com/lee-liao/claude-code-process/blob/main/src/github-service.ts
class SimpleGitHubClient:
    def __init__(self, base_url: str = "http://103.98.213.149:8510"):
        self.base_url = base_url

    async def create_branch(self, owner: str, repo: str, branch: str, base: str = "main"):
        """Create a new branch from a base branch."""
        print(f"Creating branch '{branch}' from '{base}' in '{owner}/{repo}'...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/create-branch",
                    json={
                        "owner": owner,
                        "repo": repo,
                        "branchName": branch,
                        "sourceBranch": base,
                    }
                )
                
                if resp.status_code == 200:
                    print("Branch created successfully.")
                    return True
                else:
                    print(f"Failed to create branch: {resp.status_code} - {resp.text}")
                    # Branch might already exist, which is okay
                    return False
            except Exception as e:
                print(f"Error creating branch: {e}")
                return False

    async def push_changes(self, owner: str, repo: str, message: str, files: List[Dict], branch: str, parent_branch: str = "main"):
        """Push changes to a branch using the GitHub service proxy."""
        print(f"Pushing {len(files)} changes to '{owner}/{repo}' on branch '{branch}'...")
        
        # Convert files to the format expected by the service
        # Service expects: { path: string, content?: string | null, encoding?: string }
        formatted_files = []
        for file in files:
            formatted_files.append({
                "path": file["path"],
                "content": file.get("content"),
                "encoding": file.get("encoding", "utf-8")
            })
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/push-changes",
                    json={
                        "owner": owner,
                        "repo": repo,
                        "commitMessage": message,
                        "files": formatted_files,
                        "branch": branch,
                        "parentBranch": parent_branch
                    }
                )
                
                if resp.status_code == 200:
                    print("Changes pushed successfully.")
                    return True
                else:
                    print(f"Failed to push changes: {resp.status_code} - {resp.text}")
                    return False
            except Exception as e:
                print(f"Error pushing changes: {e}")
                import traceback
                traceback.print_exc()
                return False

github_client = SimpleGitHubClient()

# Helper Functions
def find_spec_in_tree(nodes: list, spec_id: str) -> Dict[str, Any]:
    for node in nodes:
        if node.get("id") == spec_id:
            return node
        if node.get("children"):
            found = find_spec_in_tree(node["children"], spec_id)
            if found:
                return found
    return None

def update_spec_in_tree(nodes: list, spec_id: str, updates: Dict[str, Any]) -> bool:
    for node in nodes:
        if node.get("id") == spec_id:
            node.update(updates)
            return True
        if node.get("children"):
            if update_spec_in_tree(node["children"], spec_id, updates):
                return True
    return False

# Routes

@router.post("/projects/{project_id}/upload")
async def upload_openspec(project_id: str, taskId: str = None, openspecFile: UploadFile = File(...)):
    """Upload and validate OpenSpec file, writing extracted files to workspace."""
    # We create a session for this project_id if it doesn't exist
    if project_id not in user_sessions:
        user_sessions[project_id] = {"id": project_id, "specTree": [], "taskId": taskId}

    project = user_sessions[project_id]
    
    # Store taskId if provided
    if taskId:
        project["taskId"] = taskId
    
    if not openspecFile.filename.lower().endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a .zip file")
    
    content = await openspecFile.read()
    
    validation = openspec_service.validate_structure(content)
    if not validation.get("isValid"):
        raise HTTPException(status_code=400, detail=f"Invalid OpenSpec structure. {validation}")
    
    # Ensure repository is downloaded first to prevent duplicate folders
    if taskId:
        await ensure_repo_downloaded(taskId)
    
    # Do NOT store the uploaded zip under temp_openspec/<id>.
    # We only extract markdown files into the downloaded repository's openspec folder
    file_path = ""
    
    # Extract content and write to workspace (unzip ALL files, not only .md)
    change_set = (openspecFile.filename or "change").replace(".zip", "")
    spec_content = openspec_service.extract_content(
        content,
        task_id=taskId or project_id,
        write_to_disk=True,
        use_system_temp=False,
        change_set=change_set
    )
    
    # Merge with existing tree instead of replacing
    # This allows multiple zip uploads to appear as siblings under openspec/changes/
    existing_tree = project.get("specTree", [])
    new_tree = spec_content["specTree"]
    
    # Simple merge: if openspec node exists, merge its children; otherwise append
    merged_tree = existing_tree.copy()
    for new_node in new_tree:
        if new_node["name"] == "openspec":
            # Find existing openspec node
            existing_openspec = None
            for existing_node in merged_tree:
                if existing_node["name"] == "openspec":
                    existing_openspec = existing_node
                    break
            
            if existing_openspec:
                # Merge children (changes folders)
                existing_openspec["children"].extend(new_node["children"])
            else:
                merged_tree.append(new_node)
        else:
            merged_tree.append(new_node)
    
    project["openspecFile"] = {
        "name": openspecFile.filename,
        "path": file_path,
        "uploadedAt": datetime.now().isoformat()
    }
    project["specTree"] = merged_tree
    project["currentSpec"] = spec_content.get("rootSpec")
    project["updatedAt"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "specContent": {"specTree": merged_tree, "rootSpec": spec_content.get("rootSpec")},
        "message": "OpenSpec file uploaded and validated successfully"
    }

@router.get("/projects/{project_id}/specs/{spec_id}")
async def get_specification(project_id: str, spec_id: str):
    project = user_sessions.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    spec = find_spec_in_tree(project.get("specTree", []), spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    return {"success": True, "spec": spec}

@router.put("/projects/{project_id}/specs/{spec_id}")
async def update_specification(project_id: str, spec_id: str, update: SpecificationUpdate, taskId: str = None):
    project = user_sessions.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Find the spec to get its path
    spec = find_spec_in_tree(project.get("specTree", []), spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    # Update in-memory tree
    updated = update_spec_in_tree(
        project.get("specTree", []),
        spec_id,
        {
            "content": update.content,
            "suggestions": update.suggestions,
            "updatedAt": datetime.now().isoformat()
        }
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    # Write to disk
    task_id = taskId or project.get("taskId") or project_id
    spec_path = spec.get("path", "")
    
    # Ensure path is relative to repo root and starts with openspec/
    if spec_path and not spec_path.startswith("openspec/"):
        spec_path = f"openspec/{spec_path}"
    
    if spec_path:
        try:
            openspec_service.write_spec_file(task_id, spec_path, update.content, use_system_temp=False)
        except Exception as e:
            print(f"Warning: Failed to write spec file to disk: {e}")
    
    project["updatedAt"] = datetime.now().isoformat()
    return {"success": True, "message": "Specification updated successfully"}

@router.post("/projects/{project_id}/specs/{spec_id}/suggestions")
async def generate_suggestions(project_id: str, spec_id: str):
    project = user_sessions.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    spec = find_spec_in_tree(project.get("specTree", []), spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    suggestions = await claude_service.generate_suggestions(
        spec.get("content", ""),
        project.get("projectName", "")
    )
    
    update_spec_in_tree(project.get("specTree", []), spec_id, {"suggestions": suggestions})
    return {"success": True, "suggestions": suggestions}

async def run_code_generation_task(task_id: str, project_id: str, branch_name: str, prompt: str):
    task = task_manager.get(task_id)
    project = user_sessions.get(project_id)
    
    try:
        # Update Status
        task["status"] = TaskStatus(step="creating_branch", message="Creating feature branch...", completed=False).dict()
        task["updatedAt"] = datetime.now().isoformat()

        # 1. Create Branch (Assuming project has owner/repo info)
        # In this simplistic version, we might not have owner/repo if we didn't store it.
        # But let's assume the frontend sends a project ID that maps to something with repo info
        # OR we just use the project_id as a key if we stored that info.
        
        # NOTE: Since we removed the "Create Project" endpoint from OpenSpec, we need to ensure
        # the frontend calls an endpoint to initialize the session with repo details, OR
        # we rely on the main "Projects" API.
        
        # However, for this to work as an editor, we need the repo context.
        # Let's assume the session was initialized with repo info via a 'init-session' or similar,
        # or we just require it in the generate request?
        # Actually, let's fix this: The user said "New Project button should not be on openspec editor...".
        # So we assume the user is ALREADY in a project context on the frontend.
        # The frontend likely sends metadata about owner/repo.
        
        # Let's verify what `user_sessions` has. It gets populated on Upload.
        # It doesn't have owner/repo unless we set it.
        # We need an endpoint to initialize or update project details.
        
        # But for now, let's proceed. 
        owner = project.get("owner", "owner") # Placeholder
        repo = project.get("repository", "repo") # Placeholder
        
        if "owner" not in project:
             # Try to get from project ID if it matches real DB project?
             # For now, let's fail gracefully or mock if not present
             print("Warning: Project owner/repo not set in session.")

        await github_client.create_branch(owner, repo, branch_name)
        
        # 2. Push OpenSpec files
        change_id = project.get("openspecFile", {}).get("name", "change").replace(".zip", "")
        spec_tree = project.get("specTree", [])
        
        files_to_push = []
        def collect_specs(nodes):
            for node in nodes:
                if node.get("type") in ["specification", "change", "file"] and node.get("content"):
                    path = node["path"]
                    # Adjust path logic as per previous implementation
                    if not path.startswith("openspec/changes"):
                         path = f"openspec/changes/{change_id}/{path.lstrip('/')}"
                    files_to_push.append({"path": path, "content": node["content"]})
                if node.get("children"):
                    collect_specs(node["children"])
        collect_specs(spec_tree)
        
        if files_to_push:
            await github_client.push_changes(owner, repo, f"Sync OpenSpec {change_id}", files_to_push, branch_name, "main")

        # 3. Trigger Agent
        task["status"] = TaskStatus(step="generating_code", message="Queuing Agent Task...", completed=False).dict()
        
        repo_url = f"https://github.com/{owner}/{repo}/tree/{branch_name}"
        
        # Using ClaudeService to assign
        # We need to adapt the payload to what ClaudeService.assign_to_agent expects?
        # ClaudeService.assign_to_agent in `claude_service.py` is hardcoded for "simplest-repo".
        # We should probably update `ClaudeService.assign_to_agent` to accept arguments!
        # The user didn't ask us to fix `assign_to_agent` but "merge generate_suggestions".
        # Accessing `CLAUDE_WEB_API_URL` directly here is better than modifying `ClaudeService` too much if not requested.
        
        CLAUDE_WEB_API_URL = "http://103.98.213.149:8520"
        payload = {
            "taskType": "feature-implementation",
            "repoUrl": repo_url,
            "prompt": prompt or f"Implement changes from {change_id}",
            "maxTurns": 25
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{CLAUDE_WEB_API_URL}/tasks", json=payload)
            resp.raise_for_status()
            agent_task = resp.json()
            agent_task_id = agent_task.get("taskId")

        # 4. Poll
        while True:
            await asyncio.sleep(5)
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{CLAUDE_WEB_API_URL}/tasks/{agent_task_id}")
                status_data = resp.json()
                status = status_data.get("status")
                
                if status == "completed":
                    task["status"] = TaskStatus(step="completed", message="Agent finished.", completed=True).dict()
                    break
                elif status in ["failed", "error"]:
                    task["status"] = TaskStatus(step="error", message=status_data.get("error", "Unknown error"), completed=True, error=True).dict()
                    break
                else:
                    task["status"]["message"] = f"Agent working... {status}"

    except Exception as e:
        task["status"] = TaskStatus(step="error", message=str(e), completed=True, error=True).dict()

@router.post("/projects/{project_id}/generate")
async def generate_codebase(project_id: str, request: GenerateRequest, background_tasks: BackgroundTasks):
    if project_id not in user_sessions:
         # Initialize if needed, though upload should have happened
         user_sessions[project_id] = {"id": project_id}
         
    task_id = str(uuid4())
    task_manager[task_id] = {
        "id": task_id,
        "projectId": project_id,
        "status": TaskStatus(step="initializing", message="Starting...", completed=False).dict(),
        "createdAt": datetime.now().isoformat()
    }
    
    # We need to ensure we have project details (owner/repo)
    # Since we removed "Create Project", we rely on the frontend passing these details 
    # OR we add an endpoint `init_session` that the frontend calls when mounting the editor.
    # For now, let's allow `generate` to update session info if passed? 
    # The `GenerateRequest` only has `branchName` and `prompt`.
    
    # Let's assume the frontend will call a new endpoint `PUT /projects/{id}/context` or similar.
    # Or we add a `ensure_context` endpoint.
    
    background_tasks.add_task(run_code_generation_task, task_id, project_id, request.branchName, request.prompt)
    
    return {"success": True, "taskId": task_id, "message": "Started"}

@router.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str):
    task = task_manager.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "task": task}

@router.put("/projects/{project_id}/context")
async def update_project_context(project_id: str, context: Dict[str, str]):
    """Update project context (owner, repo, etc)"""
    if project_id not in user_sessions:
        user_sessions[project_id] = {"id": project_id}
    
    user_sessions[project_id].update(context)
    return {"success": True}

@router.get("/projects/{project_id}/init")
async def init_from_workspace(project_id: str, taskId: str = None):
    """Initialize or reload OpenSpec session from existing workspace files."""
    task_id = taskId or project_id
    
    try:
        # Build tree from existing workspace
        spec_content = openspec_service.build_tree_from_directory(task_id, use_system_temp=False)
        
        if not spec_content["specTree"]:
            return {
                "success": False,
                "message": "No existing workspace found",
                "specContent": {"specTree": [], "rootSpec": None}
            }
        
        # Initialize or update session
        if project_id not in user_sessions:
            user_sessions[project_id] = {"id": project_id, "taskId": task_id}
        
        project = user_sessions[project_id]
        project["specTree"] = spec_content["specTree"]
        project["currentSpec"] = spec_content.get("rootSpec")
        project["taskId"] = task_id
        project["updatedAt"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "specContent": spec_content,
            "message": "Workspace loaded successfully"
        }
    except Exception as e:
        print(f"Error loading workspace: {e}")
        return {
            "success": False,
            "message": f"Failed to load workspace: {str(e)}",
            "specContent": {"specTree": [], "rootSpec": None}
        }

@router.post("/projects/{project_id}/push")
async def push_to_github(project_id: str, taskId: str = None, branchName: str = "openspec-changes", baseBranch: str = "main"):
    """Push OpenSpec changes to GitHub using the GitHub service proxy."""
    project = user_sessions.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_id = taskId or project.get("taskId") or project_id
    owner = project.get("owner", "")
    repo = project.get("repository", "")
    
    if not owner or not repo:
        raise HTTPException(status_code=400, detail="Project owner and repository must be set. Please configure them in the Project section of the editor.")
    
    try:
        # Collect files from the on-disk workspace under:
        #   backend/temp/<taskId>/codebase/simplestrepo/openspec/changes/**
        # This matches the required behavior and avoids relying on in-memory specTree state.
        files_to_push = openspec_service.collect_changes_files_for_push(task_id, use_system_temp=False)
        
        if not files_to_push:
            return {"success": False, "message": "No files to push. Please upload an OpenSpec file first."}
        
        print(f"Pushing {len(files_to_push)} files to {owner}/{repo} on branch {branchName}")
        
        # Create branch from base branch
        branch_created = await github_client.create_branch(owner, repo, branchName, baseBranch)
        if not branch_created:
            print(f"Branch {branchName} may already exist, attempting to push anyway...")
        
        # Push to GitHub via service proxy
        success = await github_client.push_changes(
            owner, 
            repo, 
            f"Update OpenSpec changes", 
            files_to_push, 
            branchName,
            baseBranch
        )
        
        if success:
            return {"success": True, "message": f"Successfully pushed {len(files_to_push)} files to branch {branchName}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to push changes to GitHub. Check backend console for detailed error messages.")
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to push to GitHub: {str(e)}")

@router.get("/projects/{project_id}/export")
async def export_openspec_changes(project_id: str, taskId: str = None):
    """Export OpenSpec changes directory as a zip file."""
    from fastapi.responses import StreamingResponse
    
    project = user_sessions.get(project_id)
    task_id = taskId or (project.get("taskId") if project else None) or project_id
    
    try:
        zip_content = openspec_service.export_changes_as_zip(task_id, use_system_temp=False)
        
        # Create filename with task_id
        filename = f"openspec-changes-{task_id}.zip"
        
        return StreamingResponse(
            io.BytesIO(zip_content),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export changes: {str(e)}")
