from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.workflow import Specification
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, 
    TaskDetailResponse, SpecificationCreate, SpecificationResponse
)
from app.services.claude_service import ClaudeService
from app.services.activity_log_service import ActivityLogService
from app.services.notification_service import notify_task_assigned

router = APIRouter()


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
        Project.id == project_id,
        Project.owner_id == current_user.id
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
        Project.id == project_id,
        Project.owner_id == current_user.id
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
    new_task = Task(**task_dict)
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Notify assignee if task is assigned to someone other than the creator
    if new_task.assignee_id and new_task.assignee_id != current_user.id:
        try:
            notify_task_assigned(db, new_task, new_task.assignee_id)
            db.commit()
        except Exception as e:
            # Log error but don't fail task creation
            print(f"Error sending assignment notification: {e}")
    
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
        Project.id == project_id,
        Project.owner_id == current_user.id
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
        Project.id == project_id,
        Project.owner_id == current_user.id
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
    
    # Update fields
    for field, value in task_data.dict(exclude_unset=True).items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    # Notify if assignee changed and new assignee is different from current user
    if old_assignee_id != task.assignee_id and task.assignee_id:
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
    """Delete a task"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
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
    
    db.delete(task)
    db.commit()
    
    return None


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
        Project.id == project_id,
        Project.owner_id == current_user.id
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
        Project.id == task.project_id,
        Project.owner_id == current_user.id
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
            Project.id == project_id,
            Project.owner_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        repo_url = project.github_repo_url
        if repo_url and repo_url.endswith(".git"):
            repo_url = repo_url[:-4]
            
        if not repo_url:
             raise HTTPException(status_code=400, detail="Project repository URL (GitHub) is missing.")

        # 2. Init Service
        activity_service = ActivityLogService()
        claude_service = ClaudeService()

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

