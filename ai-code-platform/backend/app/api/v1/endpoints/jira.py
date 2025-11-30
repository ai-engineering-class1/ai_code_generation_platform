from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStatus, TaskStage
from app.models.integration import JiraConfiguration
from app.schemas.integration import JiraConfigCreate, JiraConfigUpdate, JiraConfigResponse
from app.services.jira_service import JiraService
from datetime import datetime
import hmac
import hashlib

router = APIRouter()


@router.post("/config", response_model=JiraConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_jira_config(
    config_data: JiraConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Configure Jira integration for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == config_data.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if config already exists
    existing_config = db.query(JiraConfiguration).filter(
        JiraConfiguration.project_id == config_data.project_id
    ).first()
    
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jira configuration already exists for this project"
        )
    
    # Create new config
    new_config = JiraConfiguration(**config_data.dict())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    
    return new_config


@router.get("/config/{project_id}", response_model=JiraConfigResponse)
async def get_jira_config(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get Jira configuration for a project"""
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
    
    config = db.query(JiraConfiguration).filter(
        JiraConfiguration.project_id == project_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jira configuration not found"
        )
    
    return config


@router.post("/sync/{project_id}")
async def sync_jira_issues(
    project_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Trigger Jira issues sync for a project"""
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
    
    config = db.query(JiraConfiguration).filter(
        JiraConfiguration.project_id == project_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jira configuration not found"
        )
    
    # Add sync task to background
    jira_service = JiraService(config)
    background_tasks.add_task(jira_service.sync_issues, db, project_id)
    
    return {"message": "Sync started", "project_id": project_id}


@router.post("/webhook")
async def jira_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Jira webhooks"""
    try:
        # Get payload
        payload = await request.json()
        event_type = payload.get("webhookEvent")
        
        # Handle different event types
        if event_type == "jira:issue_created":
            await handle_issue_created(payload, db)
        elif event_type == "jira:issue_updated":
            await handle_issue_updated(payload, db)
        elif event_type == "jira:issue_deleted":
            await handle_issue_deleted(payload, db)
        
        return {
            "message": "Webhook processed",
            "event_type": event_type
        }
    except Exception as e:
        print(f"Error processing Jira webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing webhook"
        )


async def handle_issue_created(payload: dict, db: Session):
    """Handle Jira issue created event"""
    issue = payload.get("issue", {})
    issue_key = issue.get("key")
    fields = issue.get("fields", {})
    
    # Find project by Jira project key
    project_key = issue_key.split('-')[0]
    config = db.query(JiraConfiguration).filter(
        JiraConfiguration.jira_project_key == project_key
    ).first()
    
    if not config:
        print(f"No configuration found for Jira project {project_key}")
        return
    
    # Check if task already exists
    existing_task = db.query(Task).filter(
        Task.jira_issue_key == issue_key
    ).first()
    
    if existing_task:
        print(f"Task already exists for issue {issue_key}")
        return
    
    # Parse Jira data
    jira_service = JiraService(config)
    task_type = jira_service.parse_issue_type(issue)
    priority = jira_service.parse_priority(issue)
    
    # Create new task
    new_task = Task(
        project_id=config.project_id,
        jira_issue_key=issue_key,
        title=fields.get("summary", ""),
        description=fields.get("description", ""),
        type=task_type,
        priority=priority,
        status=TaskStatus.PENDING,
        current_stage=TaskStage.REQUIREMENT
    )
    
    db.add(new_task)
    db.commit()
    print(f"Created task for Jira issue {issue_key}")


async def handle_issue_updated(payload: dict, db: Session):
    """Handle Jira issue updated event"""
    issue = payload.get("issue", {})
    issue_key = issue.get("key")
    fields = issue.get("fields", {})
    changelog = payload.get("changelog", {})
    
    # Find existing task
    task = db.query(Task).filter(
        Task.jira_issue_key == issue_key
    ).first()
    
    if not task:
        print(f"No task found for Jira issue {issue_key}")
        return
    
    # Update task fields
    task.title = fields.get("summary", task.title)
    task.description = fields.get("description", task.description)
    task.updated_at = datetime.utcnow()
    
    db.commit()
    print(f"Updated task for Jira issue {issue_key}")


async def handle_issue_deleted(payload: dict, db: Session):
    """Handle Jira issue deleted event"""
    issue = payload.get("issue", {})
    issue_key = issue.get("key")
    
    # Find and delete task
    task = db.query(Task).filter(
        Task.jira_issue_key == issue_key
    ).first()
    
    if task:
        # Don't actually delete, just mark as cancelled
        task.status = TaskStatus.CANCELLED
        task.updated_at = datetime.utcnow()
        db.commit()
        print(f"Cancelled task for deleted Jira issue {issue_key}")
