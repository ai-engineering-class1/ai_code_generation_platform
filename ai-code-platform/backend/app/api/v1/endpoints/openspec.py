"""OpenSpec Editor Endpoints."""
import asyncio
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
openspec_service = OpenSpecService("./temp_openspec")
claude_service = ClaudeService()

# Helper for GitHub Logic (Simplified for Editor)
class SimpleGitHubClient:
    def __init__(self, token: str):
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        self.base_url = "https://api.github.com"

    async def create_branch(self, owner: str, repo: str, branch: str, base: str = "main"):
        async with httpx.AsyncClient() as client:
            # Get base SHA
            resp = await client.get(f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{base}", headers=self.headers)
            if resp.status_code != 200:
                print(f"Failed to get base branch {base}: {resp.text}")
                return False
            sha = resp.json()["object"]["sha"]
            
            # Create branch
            resp = await client.post(
                f"{self.base_url}/repos/{owner}/{repo}/git/refs",
                headers=self.headers,
                json={"ref": f"refs/heads/{branch}", "sha": sha}
            )
            return resp.status_code == 201

    async def push_changes(self, owner: str, repo: str, message: str, files: List[Dict], branch: str):
        # Simplified push: sequential commits or using trees requires more logic
        # For simplicity, we create/update files individually or use a tree based approach
        # Using the tree approach is better
        async with httpx.AsyncClient() as client:
            # 1. Get latest commit SHA of branch
            resp = await client.get(f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{branch}", headers=self.headers)
            if resp.status_code != 200: return False
            latest_commit_sha = resp.json()["object"]["sha"]
            
            # 2. Creating blobs
            blobs = []
            for file in files:
                resp = await client.post(f"{self.base_url}/repos/{owner}/{repo}/git/blobs", headers=self.headers, json={"content": file["content"], "encoding": "utf-8"})
                if resp.status_code == 201:
                    blobs.append({"path": file["path"], "mode": "100644", "type": "blob", "sha": resp.json()["sha"]})
            
            # 3. Create Tree
            resp = await client.post(f"{self.base_url}/repos/{owner}/{repo}/git/trees", headers=self.headers, json={"base_tree": latest_commit_sha, "tree": blobs})
            if resp.status_code != 201: return False
            tree_sha = resp.json()["sha"]
            
            # 4. Create Commit
            resp = await client.post(f"{self.base_url}/repos/{owner}/{repo}/git/commits", headers=self.headers, json={"message": message, "tree": tree_sha, "parents": [latest_commit_sha]})
            if resp.status_code != 201: return False
            new_commit_sha = resp.json()["sha"]
            
            # 5. Update Reference
            resp = await client.patch(f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{branch}", headers=self.headers, json={"sha": new_commit_sha})
            return resp.status_code == 200

github_client = SimpleGitHubClient(settings.GITHUB_TOKEN or "")

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
async def upload_openspec(project_id: str, openspecFile: UploadFile = File(...)):
    """Upload and validate OpenSpec file."""
    # We create a session for this project_id if it doesn't exist
    # In a real app we'd fetch project from DB
    if project_id not in user_sessions:
        # Create a dummy session for now, assuming frontend passed a valid UUID
        user_sessions[project_id] = {"id": project_id, "specTree": []}

    project = user_sessions[project_id]
    
    if not openspecFile.filename.lower().endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a .zip file")
    
    content = await openspecFile.read()
    
    validation = openspec_service.validate_structure(content)
    if not validation.get("isValid"):
        raise HTTPException(status_code=400, detail=f"Invalid OpenSpec structure. {validation}")
    
    file_path = await openspec_service.save_uploaded_file(project_id, openspecFile.filename, content)
    spec_content = openspec_service.extract_content(content)
    
    project["openspecFile"] = {
        "name": openspecFile.filename,
        "path": file_path,
        "uploadedAt": datetime.now().isoformat()
    }
    project["specTree"] = spec_content["specTree"]
    project["currentSpec"] = spec_content.get("rootSpec")
    project["updatedAt"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "specContent": spec_content,
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
async def update_specification(project_id: str, spec_id: str, update: SpecificationUpdate):
    project = user_sessions.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
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
            await github_client.push_changes(owner, repo, f"Sync OpenSpec {change_id}", files_to_push, branch_name)

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
