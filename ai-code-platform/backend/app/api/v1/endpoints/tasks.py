from fastapi import APIRouter, Depends, HTTPException, status, Query,Body
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
from urllib.parse import urlparse
import httpx
import logging
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.workflow import Specification
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, 
    TaskDetailResponse, SpecificationCreate, SpecificationResponse,
    WorkflowHistoryResponse
)
from app.services.claude_service import ClaudeService
from app.services.activity_log_service import ActivityLogService
from app.services.notification_service import notify_task_assigned
from app.services.openspec_service import OpenSpecService
from app.models.task import TaskStatus, ActivityStatus, transition
from pathlib import Path

router = APIRouter()
class AssignAgentCIRequest(BaseModel):
    prompts: str
    repo_url: str

openspec_service = OpenSpecService(settings.WORKSPACE_ROOT)


def seed_default_openspec_for_task(project: Project, task: Task) -> None:
    """
    Seed a minimal OpenSpec markdown file for a task so the OpenSpec editor isn't empty.
    Idempotent: if any .md already exists under openspec/changes for this task workspace, do nothing.
    """
    try:
        changes_dir = openspec_service.get_openspec_changes_dir(task.id, use_system_temp=False)
        # If anything already exists, don't overwrite.
        if any(changes_dir.rglob("*.md")):
            return

        rel_path = "openspec/changes/seed/task.md"
        content_lines = [
            f"# {task.title}".strip(),
            "",
            (task.description or "").strip(),
        ]

        # Optional context (kept short). This helps the agent/spec without requiring extra user work.
        if getattr(project, "name", None) or getattr(project, "description", None):
            content_lines += [
                "",
                "## Project Context",
                f"- Project: {project.name}",
            ]
            if project.description:
                content_lines.append(f"- Description: {project.description}")

        content = "\n".join(content_lines).strip() + "\n"
        openspec_service.write_spec_file(task.id, rel_path, content, use_system_temp=False)
    except Exception as e:
        # Never fail task creation due to seeding issues
        print(f"Warning: failed to seed default OpenSpec for task {getattr(task, 'id', None)}: {e}")


@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
async def list_project_tasks(
    project_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all tasks for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    tasks = db.query(Task).filter(
        Task.project_id == project_id
    ).offset(skip).limit(limit).all()
    
    return tasks


@router.post("/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: str,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new task"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Create task with project_id from URL path
    # Use by_alias=False to get snake_case field names for the database
    task_dict = task_data.dict(by_alias=False)
    task_dict['project_id'] = project_id
    
    # Logic: If assignee is given, set status to IN_PROGRESS (if not already set)
    # The default status in model is PENDING.
    if task_dict.get('assignee_id'):
        task_dict['status'] = TaskStatus.IN_PROGRESS
    
    new_task = Task(**task_dict)
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Notify assignee if task is assigned to someone other than the creator
    if new_task.assignee_id:
        # Create Activity Log: Pending User Input
        # Situation: Task assigned to user
        from app.models.task import ActivityStatus
        
        assignee_name = "User"
        assignee = db.query(User).filter(User.id == new_task.assignee_id).first()
        if assignee:
            assignee_name = assignee.name or assignee.email

        activity_service = ActivityLogService()
        activity_service.start_activity(
            db=db,
            task_id=new_task.id,
            title="Task Assigned",
            operator_id="system",  # System generated
            activity_type="system_event",
            situation=f"Task created and assigned to {assignee_name}.",
            task_role=f"Wait for {assignee_name} to start work.",
            status=ActivityStatus.PENDING_USER_INPUT
        )

        if new_task.assignee_id != current_user.id:
            try:
                notify_task_assigned(db, new_task, new_task.assignee_id)
                db.commit()
            except Exception as e:
                # Log error but don't fail task creation
                print(f"Error sending assignment notification: {e}")

    # Seed a default OpenSpec file so OpenSpec editor isn't empty for newly created tasks
    seed_default_openspec_for_task(project, new_task)
    
    return new_task


@router.get("/{project_id}/tasks/{task_id}", response_model=TaskDetailResponse)
async def get_task(
    project_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific task with detailed information"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    from app.models.workflow import Specification, CodeGeneration
    from app.models.task import TaskWorkflowHistory
    
    print(f"Fetching task: task_id={task_id}, project_id={project_id}")
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()
    
    if not task:
        print(f"Task not found: task_id={task_id}, project_id={project_id}")
        # Debug: Check if task exists with different project_id
        task_anywhere = db.query(Task).filter(Task.id == task_id).first()
        if task_anywhere:
            print(f"Task exists but with different project_id: {task_anywhere.project_id}")
        else:
            print(f"Task with id {task_id} does not exist at all")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task not found: task_id={task_id}, project_id={project_id}"
        )
    
    print(f"Task found: {task.id} - {task.title}")
    
    # Load related data
    task.specification = db.query(Specification).filter(
        Specification.task_id == task_id
    ).order_by(Specification.version.desc()).first()
    
    task.code_generation = db.query(CodeGeneration).filter(
        CodeGeneration.task_id == task_id
    ).order_by(CodeGeneration.created_at.desc()).first()
    
    # Load workflow history - use try/except to handle cases where table might not exist or have issues
    try:
        task.workflow_history = db.query(TaskWorkflowHistory).filter(
            TaskWorkflowHistory.task_id == task_id
        ).order_by(TaskWorkflowHistory.created_at.desc()).all()
    except Exception as e:
        print(f"Warning: Could not load workflow history: {e}")
        # Set to empty list if query fails
        task.workflow_history = []

    # Get latest activity info
    activity_service = ActivityLogService()
    latest_activity_info = activity_service.get_latest_activity_info(db, task_id)
    task.latest_activity_status = latest_activity_info["status"]
    task.latest_activity_role = latest_activity_info["task_role"]
    
    return task


@router.get("/{project_id}/tasks/{task_id}/activities", response_model=List[WorkflowHistoryResponse])
async def get_task_activities(
    project_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all activities (workflow history) for a task"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify task exists and belongs to project
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    from app.models.task import TaskWorkflowHistory
    
    # Fetch workflow history ordered by created_at DESC (newest first)
    try:
        activities = db.query(TaskWorkflowHistory).filter(
            TaskWorkflowHistory.task_id == task_id
        ).order_by(TaskWorkflowHistory.created_at.desc()).all()
        
        return activities
    except Exception as e:
        print(f"Error fetching activities: {e}")
        import traceback
        traceback.print_exc()
        # Return empty list if query fails
        return []


@router.put("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: str,
    task_id: str,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a task"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Store old assignee_id to detect changes
    old_assignee_id = task.assignee_id
    print(f"DEBUG: Updating task {task_id}. Old assignee: {old_assignee_id}. Payload status: {task_data.status} Assignee: {task_data.assignee_id}")

    # Validation: Status Transition
    if task_data.status and task_data.status != task.status:

        try:
            # Validate transition (will raise ValueError if invalid)
            # Use enum value for comparison/transition check
            current_status_enum = TaskStatus(task.status)
            new_status_enum = TaskStatus(task_data.status)
            transition(current_status_enum, new_status_enum)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    # Update fields
    for field, value in task_data.dict(exclude_unset=True).items():
        print(f"DEBUG: Setting {field} to {value}")
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    print(f"DEBUG: Update committed. New assignee: {task.assignee_id}")
    
    # Notify if assignee changed and new assignee is different from current user
    if old_assignee_id != task.assignee_id and task.assignee_id:
        print("DEBUG: Assignee change detected. Creating activity...")
        # Assignment Logic: Create Activity if newly assigned (Unassigned -> Assigned)
        # Or even just Assgined -> Assigned (Re-assigned)
        
        assignee_name = "User"
        assignee = db.query(User).filter(User.id == task.assignee_id).first()
        if assignee:
            assignee_name = assignee.name or assignee.email
            
        activity_service = ActivityLogService()
        activity_service.start_activity(
            db=db,
            task_id=task.id,
            title="Task Assigned",
            operator_id="system",
            activity_type="system_event",
            situation=f"Task re-assigned to {assignee_name}.",
            task_role=f"Wait for {assignee_name} to start work.",
            status=ActivityStatus.PENDING_USER_INPUT
        )

        # Auto-transition: PENDING -> IN_PROGRESS on assignment
        if task.status == TaskStatus.PENDING:
            # Check if allowed
            from app.models.task import can_transition
            if can_transition(TaskStatus.PENDING, TaskStatus.IN_PROGRESS):
                task.status = TaskStatus.IN_PROGRESS
                db.commit()
                db.refresh(task)

        # Only notify if assignee is different from the person making the change
        if task.assignee_id != current_user.id:
            try:
                notify_task_assigned(db, task, task.assignee_id)
                db.commit()
            except Exception as e:
                # Log error but don't fail task update
                print(f"Error sending assignment notification: {e}")
    
    return task


@router.delete("/{project_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a task and all related records"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Delete related records first to avoid foreign key constraint violations
    from app.models.workflow import Specification, CodeGeneration
    from app.models.task import TaskWorkflowHistory
    
    try:
        # Delete workflow history
        db.query(TaskWorkflowHistory).filter(
            TaskWorkflowHistory.task_id == task_id
        ).delete()
        
        # Delete code generations (which may have pipeline_executions)
        code_generations = db.query(CodeGeneration).filter(
            CodeGeneration.task_id == task_id
        ).all()
        for code_gen in code_generations:
            # Delete pipeline executions first
            from app.models.workflow import PipelineExecution
            db.query(PipelineExecution).filter(
                PipelineExecution.code_generation_id == code_gen.id
            ).delete()
            # Then delete the code generation
            db.delete(code_gen)
        
        # Delete specifications
        db.query(Specification).filter(
            Specification.task_id == task_id
        ).delete()
        
        # Finally, delete the task itself
        db.delete(task)
        db.commit()
        
        return None
    except Exception as e:
        db.rollback()
        print(f"Error deleting task {task_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}"
        )

@router.post("/{project_id}/tasks/{task_id}/assign-ci")
async def assign_to_agent_ci(
    project_id: str,
    task_id: str,
    request: AssignAgentCIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Assign task to remote Claude Web API agent with custom prompts.
    
    Args:
        project_id: Project ID
        task_id: Task ID
        request: Request body containing prompts and repo_url
    
    STAR Lifecycle:
    1. Start Activity (S, T): "Remote Agent Execution", Context = Repo URL.
    2. Execute: Call Remote Agent API with custom prompts.
    3. Update Activity (A): "Dispatched to Remote Agent (ID: ...)"
    """
    try:
        prompts = request.prompts
        repo_url = request.repo_url

        # 1. Validate Project
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Clean repo_url (remove .git suffix if present)
        clean_repo_url = repo_url
        if clean_repo_url and clean_repo_url.endswith(".git"):
            clean_repo_url = clean_repo_url[:-4]

        if not clean_repo_url:
            raise HTTPException(status_code=400, detail="Repository URL is required.")

        # 2. Init Service
        activity_service = ActivityLogService()
        claude_service = ClaudeService()

        # 3. STAR: Start Activity (Situation, Task)
        activity = activity_service.start_activity(
            db=db,
            task_id=task_id,
            title="Remote Agent Execution (CI)",
            operator_id="agent-claude-remote",
            activity_type="agent_execution",
            situation=f"User initiated remote agent task for repository {clean_repo_url} with custom prompts.",
            task_role="Implement requested feature and generate code (Remote Agent) with custom instructions."
        )

        # 4. Execute Remote Call with custom prompts
        try:
            result = await claude_service.assign_to_agent_ci(repo_url=clean_repo_url, prompts=prompts)
            remote_task_id = result.get("taskId")

            # 5. STAR: Update Activity (Action) with success
            activity = activity_service.update_activity(
                db=db,
                activity_id=activity.id,
                action=f"Successfully dispatched task to remote agent.\nRemote Task ID: {remote_task_id}.\nPrompt: {prompts[:200]}{'...' if len(prompts) > 200 else ''}\nWaiting for results via polling...",
                metadata={"remote_task_id": remote_task_id, "remote_status": "dispatched", "custom_prompts": prompts}
            )

            # Return activity so frontend can start polling 'remote_task_id'
            return activity

        except Exception as e:
            # Handle Dispatch Failure
            activity_service.end_activity(
                db=db,
                activity_id=activity.id,
                result=f"Failed to dispatch to remote agent. Error: {str(e)}",
                status="failed"
            )
            raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{project_id}/tasks/{task_id}/specifications", response_model=SpecificationResponse, status_code=status.HTTP_201_CREATED)
async def create_specification(
    project_id: str,
    task_id: str,
    spec_data: SpecificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a specification for a task"""
    # Verify project and task ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    new_spec = Specification(
        **spec_data.dict(),
        task_id=task_id
    )
    
    db.add(new_spec)
    db.commit()
    db.refresh(new_spec)
    
    return new_spec


@router.post("/specifications/{spec_id}/approve", response_model=SpecificationResponse)
async def approve_specification(
    spec_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Approve a specification"""
    from datetime import datetime
    
    spec = db.query(Specification).filter(Specification.id == spec_id).first()
    
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specification not found"
        )
    
    # Verify ownership through task and project
    task = db.query(Task).filter(Task.id == spec.task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    project = db.query(Project).filter(
        Project.id == task.project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve this specification"
        )
    
    # Approve the specification
    spec.approved = True
    spec.approved_by = current_user.id
    spec.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(spec)
    
    return spec


@router.post("/{project_id}/tasks/{task_id}/assign")
async def assign_to_agent(
    project_id: str,
    task_id: str,
    source_activity_id: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Assign task to remote Claude Web API agent.
    
    STAR Lifecycle:
    1. Start Activity (S, T): "Remote Agent Execution", Context = Repo URL.
    2. Execute: Call Remote Agent API.
    3. Update Activity (A): "Dispatched to Remote Agent (ID: ...)"
    """
    try:
        # 1. Fetch Project for Repo URL
        project = db.query(Project).filter(
            Project.id == project_id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        repo_url = project.github_repo_url
        if repo_url and repo_url.endswith(".git"):
            repo_url = repo_url[:-4]
            
        if not repo_url:
             # Fallback: Check GitHubConfiguration
             from app.models.integration import GitHubConfiguration
             github_config = db.query(GitHubConfiguration).filter(
                 GitHubConfiguration.project_id == project_id
             ).first()
             
             if github_config:
                 repo_url = f"https://github.com/{github_config.repo_owner}/{github_config.repo_name}"

        if not repo_url:
             raise HTTPException(status_code=400, detail="Project repository URL (GitHub) is missing.")

        # 2. Init Service
        activity_service = ActivityLogService()
        claude_service = ClaudeService()

        # 2a. Seed openspec/changes in the repo so the remote agent can find the spec.
        try:
            await _ensure_openspec_change(project, task=task, db=db)
        except Exception as e:
            # Non-blocking; log and continue
            print(f"Warning: failed to seed OpenSpec before remote agent dispatch: {e}")

        # Handle Source Activity (if transferring from an existing activity)
        if source_activity_id:
            try:
                # Close the previous activity
                from app.models.task import ActivityStatus
                
                # Fetch to get current details for appending action
                source_activity = activity_service.get_activity(db, source_activity_id)
                if source_activity and not source_activity.activity_end_at:
                    # Append Action
                    new_action = (source_activity.action or "") + "\nTask transferred to remote agent."
                    activity_service.update_activity(db=db, activity_id=source_activity_id, action=new_action)
                    
                    # End Activity
                    activity_service.end_activity(
                        db=db,
                        activity_id=source_activity_id,
                        result="Check the other activity for the result",
                        status=ActivityStatus.TRANSFERRED
                    )
            except Exception as e:
                print(f"Warning: Failed to close source activity {source_activity_id}: {e}")
                # Don't block the main flow

        # 3. STAR: Start Activity (Situation, Task)
        activity = activity_service.start_activity(
            db=db,
            task_id=task_id,
            title="Remote Agent Execution",
            operator_id="agent-claude-remote",
            activity_type="agent_execution",
            situation=f"User initiated remote agent task for repository {repo_url}.",
            task_role="Implement requested feature and generate code (Remote Agent)."
        )

        # 4. Execute Remote Call
        try:
            result = await claude_service.assign_to_agent(repo_url=repo_url)
            remote_task_id = result.get("taskId")
            
            # 5. STAR: Update Activity (Action) with success
            # CRITICAL: Capture the returned/refreshed activity object!
            activity = activity_service.update_activity(
                db=db,
                activity_id=activity.id,
                action=f"Successfully dispatched task to remote agent.\nRemote Task ID: {remote_task_id}.\nPrompt: Please implement the OpenSpec change under openspec/changes\nWaiting for results via polling...",
                metadata={"remote_task_id": remote_task_id, "remote_status": "dispatched"}
            )
            
            # Return activity so frontend can start polling 'remote_task_id'
            return activity
            
        except Exception as e:
            # Handle Dispatch Failure
            activity_service.end_activity(
                db=db,
                activity_id=activity.id,
                result=f"Failed to dispatch to remote agent. Error: {str(e)}",
                status="failed"
            )
            raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def _parse_owner_repo(repo_url: str):
    """Extract owner and repo from a GitHub URL or owner/repo string."""
    parsed = urlparse(repo_url)
    path = parsed.path or repo_url
    parts = path.strip("/").split("/")
    if len(parts) >= 2:
        owner = parts[0]
        repo = parts[1].replace(".git", "")
        return owner, repo
    raise ValueError(f"Invalid repository URL: {repo_url}")


async def _ensure_openspec_change(project: Project, task: Task, db: Session):
    """
    Ensure an openspec/changes entry exists in the repo before dispatching to the remote agent.
    Uses the code-generation-platform proxy (/push-changes) to commit a stub spec if missing.
    """
    if not project.github_repo_url:
        return

    try:
        owner, repo = _parse_owner_repo(project.github_repo_url)
    except Exception as e:
        print(f"Skipping OpenSpec seed due to repo parse error: {e}")
        return

    # Prefer the latest saved specification, fall back to task details
    spec = (
        db.query(Specification)
        .filter(Specification.task_id == task.id)
        .order_by(Specification.version.desc())
        .first()
    )

    content = spec.content if spec else f"""# {task.title}

{task.description or 'No description provided.'}

## Acceptance Criteria
- [ ] Fill in acceptance criteria

## Notes
- Generated automatically to seed openspec/changes for remote agent."""

    files = [
        {
            "path": f"openspec/changes/{task.id}/spec.md",
            "content": content,
            "encoding": "utf-8",
        }
    ]

    payload = {
        "owner": owner,
        "repo": repo,
        "commitMessage": f"Add OpenSpec stub for task {task.title}",
        "files": files,
        "branch": "main",
        "parentBranch": "main",
    }

    try:
        print(f"[OpenSpec seed] Seeding task {task.id} to {owner}/{repo} via {settings.CODEGEN_API_URL}")
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{settings.CODEGEN_API_URL}/push-changes", json=payload)
            if resp.status_code >= 400:
                print(f"[OpenSpec seed] push-changes failed: {resp.status_code} {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to seed openspec/changes in GitHub before dispatching agent."
                )
            print(f"[OpenSpec seed] Seeded openspec/changes for task {task.id} in {owner}/{repo}")
    except Exception as e:
        # Block dispatch if we cannot guarantee the spec exists
        print(f"[OpenSpec seed] Error seeding openspec/changes for task {task.id}: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed openspec/changes: {str(e)}"
        )


@router.get("/agent-tasks/{agent_task_id}")
async def get_agent_task(
    agent_task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get task status from remote Claude Web API agent"""
    try:
        claude_service = ClaudeService()
        result = await claude_service.get_agent_task(agent_task_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
