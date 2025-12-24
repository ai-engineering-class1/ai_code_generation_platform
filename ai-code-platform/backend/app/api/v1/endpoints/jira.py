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
        Project.id == config_data.project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if config already exists - update if it does, create if it doesn't
    existing_config = db.query(JiraConfiguration).filter(
        JiraConfiguration.project_id == config_data.project_id
    ).first()
    
    if existing_config:
        # Update existing config
        config_dict = config_data.model_dump(exclude_unset=True)
        # Don't update access_token if not provided
        if 'access_token' not in config_dict or not config_dict['access_token']:
            config_dict.pop('access_token', None)
        # Don't update jira_email if not provided (keep existing)
        if 'jira_email' not in config_dict or not config_dict['jira_email']:
            config_dict.pop('jira_email', None)
        
        for field, value in config_dict.items():
            setattr(existing_config, field, value)
        
        db.commit()
        db.refresh(existing_config)
        return existing_config
    else:
        # Create new config
        new_config = JiraConfiguration(**config_data.model_dump())
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
        Project.id == project_id
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
    print(f"=== SYNC ENDPOINT CALLED ===")
    print(f"Project ID: {project_id}")
    print(f"User ID: {current_user.id}")
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    print(f"Project found: {project is not None}")
    
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
    # Note: We pass the config ID and project_id, not the db session
    # The background task will create its own db session
    from app.core.database import SessionLocal
    jira_service = JiraService(config)
    
    async def sync_task():
        print(f"=== Background sync task started for project {project_id} ===")
        db_session = SessionLocal()
        try:
            await jira_service.sync_issues(db_session, project_id)
            print(f"=== Background sync task completed for project {project_id} ===")
        except Exception as e:
            print(f"ERROR in background sync task: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db_session.close()
    
    print(f"Adding background sync task for project {project_id}")
    background_tasks.add_task(sync_task)
    print(f"Background sync task added successfully")
    
    return {"message": "Sync started", "project_id": project_id}


@router.get("/webhook")
@router.head("/webhook")
@router.post("/webhook")
async def jira_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Jira webhooks"""
    # Handle HEAD/GET requests for webhook validation (Jira sends these to verify the endpoint)
    if request.method in ["GET", "HEAD"]:
        print("✅ Jira webhook validation request received (HEAD/GET)")
        return {"status": "ok", "message": "Webhook endpoint is active"}
    
    print("=" * 60)
    print("🔔 JIRA WEBHOOK RECEIVED")
    print("=" * 60)
    
    try:
        # Get payload
        payload = await request.json()
        event_type = payload.get("webhookEvent")
        
        print(f"📥 Event Type: {event_type}")
        print(f"📦 Payload keys: {list(payload.keys())}")
        
        # Log issue details if available
        issue = payload.get("issue", {})
        if issue:
            issue_key = issue.get("key", "Unknown")
            fields = issue.get("fields", {})
            summary = fields.get("summary", "No summary")
            print(f"📋 Issue Key: {issue_key}")
            print(f"📝 Summary: {summary}")
        
        # Handle different event types
        if event_type == "jira:issue_created":
            print("✅ Processing issue_created event...")
            await handle_issue_created(payload, db)
            print("✅ Issue created handler completed")
        elif event_type == "jira:issue_updated":
            print("✅ Processing issue_updated event...")
            await handle_issue_updated(payload, db)
            print("✅ Issue updated handler completed")
        elif event_type == "jira:issue_deleted":
            print("✅ Processing issue_deleted event...")
            await handle_issue_deleted(payload, db)
            print("✅ Issue deleted handler completed")
        else:
            print(f"⚠️ Unknown event type: {event_type}")
        
        print("=" * 60)
        print("✅ WEBHOOK PROCESSED SUCCESSFULLY")
        print("=" * 60)
        
        return {
            "message": "Webhook processed",
            "event_type": event_type
        }
    except Exception as e:
        print("=" * 60)
        print(f"❌ ERROR PROCESSING JIRA WEBHOOK: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )


async def handle_issue_created(payload: dict, db: Session):
    """Handle Jira issue created event"""
    issue = payload.get("issue", {})
    issue_key = issue.get("key")
    fields = issue.get("fields", {})
    
    if not issue_key:
        print("❌ No issue key found in payload")
        return
    
    print(f"🔍 Processing issue creation: {issue_key}")
    
    # Find project by Jira project key
    project_key = issue_key.split('-')[0]
    print(f"🔍 Looking for Jira project key: {project_key}")
    
    config = db.query(JiraConfiguration).filter(
        JiraConfiguration.jira_project_key == project_key
    ).first()
    
    if not config:
        print(f"❌ No configuration found for Jira project {project_key}")
        print(f"   Available configurations:")
        all_configs = db.query(JiraConfiguration).all()
        for c in all_configs:
            print(f"   - Project ID: {c.project_id}, Jira Key: {c.jira_project_key}")
        return
    
    print(f"✅ Found configuration for project: {config.project_id}")
    
    # Check if task already exists
    existing_task = db.query(Task).filter(
        Task.jira_issue_key == issue_key
    ).first()
    
    if existing_task:
        print(f"⚠️ Task already exists for issue {issue_key} (Task ID: {existing_task.id})")
        return
    
    # Parse Jira data
    jira_service = JiraService(config)
    task_type = jira_service.parse_issue_type(issue)
    priority = jira_service.parse_priority(issue)
    
    summary = fields.get("summary", "")
    description = fields.get("description", "")
    
    print(f"📝 Creating task:")
    print(f"   - Title: {summary}")
    print(f"   - Type: {task_type}")
    print(f"   - Priority: {priority}")
    print(f"   - Project ID: {config.project_id}")
    
    # Create new task
    new_task = Task(
        project_id=config.project_id,
        jira_issue_key=issue_key,
        title=summary,
        description=description if isinstance(description, str) else str(description),
        type=task_type,
        priority=priority,
        status=TaskStatus.PENDING,
        current_stage=TaskStage.REQUIREMENT
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    print(f"✅ Successfully created task for Jira issue {issue_key}")
    print(f"   - Task ID: {new_task.id}")
    print(f"   - Project ID: {new_task.project_id}")


async def handle_issue_updated(payload: dict, db: Session):
    """Handle Jira issue updated event"""
    issue = payload.get("issue", {})
    issue_key = issue.get("key")
    fields = issue.get("fields", {})
    changelog = payload.get("changelog", {})
    
    if not issue_key:
        print("❌ No issue key found in payload")
        return
    
    print(f"🔍 Processing issue update: {issue_key}")
    
    # Find existing task
    task = db.query(Task).filter(
        Task.jira_issue_key == issue_key
    ).first()
    
    if not task:
        print(f"⚠️ No task found for Jira issue {issue_key}")
        print(f"   This might be a new issue - consider creating it first")
        return
    
    print(f"✅ Found existing task: {task.id}")
    
    # Update task fields
    old_title = task.title
    new_title = fields.get("summary", task.title)
    new_description = fields.get("description", task.description)
    
    if isinstance(new_description, dict):
        # Handle ADF format description
        new_description = str(new_description)
    
    task.title = new_title
    task.description = new_description if new_description else task.description
    task.updated_at = datetime.utcnow()
    
    db.commit()
    print(f"✅ Updated task for Jira issue {issue_key}")
    if old_title != new_title:
        print(f"   - Title changed: '{old_title}' → '{new_title}'")


async def handle_issue_deleted(payload: dict, db: Session):
    """Handle Jira issue deleted event"""
    issue = payload.get("issue", {})
    issue_key = issue.get("key")
    
    if not issue_key:
        print("❌ No issue key found in payload")
        return
    
    print(f"🔍 Processing issue deletion: {issue_key}")
    
    # Find and delete task
    task = db.query(Task).filter(
        Task.jira_issue_key == issue_key
    ).first()
    
    if task:
        # Don't actually delete, just mark as cancelled
        task.status = TaskStatus.CANCELLED
        task.updated_at = datetime.utcnow()
        db.commit()
        print(f"✅ Cancelled task for deleted Jira issue {issue_key}")
        print(f"   - Task ID: {task.id}")
        print(f"   - Status set to: CANCELLED")
    else:
        print(f"⚠️ No task found for Jira issue {issue_key} (nothing to cancel)")
