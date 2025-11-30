from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStage, TaskStatus
from app.models.integration import GitHubConfiguration
from app.models.workflow import Specification, CodeGeneration, CodeGenerationStatus, PipelineExecution, PipelineType, PipelineStatus
from app.schemas.integration import GitHubConfigCreate, GitHubConfigUpdate, GitHubConfigResponse
from app.services.github_service import GitHubService
from app.services.claude_service import ClaudeService
from datetime import datetime
import hmac
import hashlib

router = APIRouter()


@router.post("/config", response_model=GitHubConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_github_config(
    config_data: GitHubConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Configure GitHub integration for a project"""
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
    existing_config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == config_data.project_id
    ).first()
    
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub configuration already exists for this project"
        )
    
    # Create new config
    new_config = GitHubConfiguration(**config_data.dict())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    
    return new_config


@router.get("/config/{project_id}", response_model=GitHubConfigResponse)
async def get_github_config(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get GitHub configuration for a project"""
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
    
    config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == project_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub configuration not found"
        )
    
    return config


@router.post("/generate-spec/{task_id}")
async def generate_specification(
    task_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate technical specification for a task using Claude"""
    # Get task
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == task.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Generate specification using Claude
    claude_service = ClaudeService()
    spec_content = await claude_service.generate_specification(
        task.title,
        task.description or "",
        task.type.value
    )
    
    if not spec_content:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate specification"
        )
    
    # Create specification
    new_spec = Specification(
        task_id=task_id,
        content=spec_content,
        version=1
    )
    
    db.add(new_spec)
    
    # Update task status
    task.current_stage = TaskStage.SPEC_REVIEW
    task.status = TaskStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(new_spec)
    
    return {
        "message": "Specification generated successfully",
        "task_id": task_id,
        "specification_id": new_spec.id
    }


@router.post("/generate-code/{task_id}")
async def trigger_code_generation(
    task_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Trigger GitHub Actions workflow to generate code"""
    # Get task with specification
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == task.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if specification exists and is approved
    if not task.specification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specification not found. Generate specification first."
        )
    
    if not task.specification.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specification not approved. Approve specification first."
        )
    
    # Get GitHub configuration
    github_config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == task.project_id
    ).first()
    
    if not github_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub not configured for this project"
        )
    
    # Create code generation record
    branch_name = f"{github_config.branch_prefix}/{task_id}"
    new_code_gen = CodeGeneration(
        task_id=task_id,
        specification_id=task.specification.id,
        github_branch=branch_name,
        status=CodeGenerationStatus.GENERATING
    )
    
    db.add(new_code_gen)
    
    # Update task status
    task.current_stage = TaskStage.CODE_GENERATION
    
    db.commit()
    db.refresh(new_code_gen)
    
    # Trigger GitHub Actions workflow (in background)
    github_service = GitHubService(github_config)
    background_tasks.add_task(
        trigger_github_workflow,
        github_service,
        task_id,
        task.specification.id,
        branch_name
    )
    
    return {
        "message": "Code generation triggered",
        "task_id": task_id,
        "code_generation_id": new_code_gen.id,
        "branch": branch_name
    }


async def trigger_github_workflow(
    github_service: GitHubService,
    task_id: str,
    spec_id: str,
    branch_name: str
):
    """Helper function to trigger GitHub Actions workflow"""
    await github_service.trigger_workflow(
        "ai-code-generation.yml",
        "main",
        {
            "task_id": task_id,
            "spec_id": spec_id,
            "branch_name": branch_name
        }
    )


@router.post("/webhook")
async def github_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle GitHub webhooks"""
    try:
        # Get payload
        payload = await request.json()
        action = payload.get("action")
        
        # Handle different event types based on headers
        event_type = request.headers.get("X-GitHub-Event")
        
        if event_type == "pull_request":
            await handle_pull_request_event(payload, db)
        elif event_type == "workflow_run":
            await handle_workflow_run_event(payload, db)
        elif event_type == "push":
            await handle_push_event(payload, db)
        
        return {
            "message": "Webhook processed",
            "event_type": event_type,
            "action": action
        }
    except Exception as e:
        print(f"Error processing GitHub webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing webhook"
        )


async def handle_pull_request_event(payload: dict, db: Session):
    """Handle GitHub pull request events"""
    action = payload.get("action")
    pull_request = payload.get("pull_request", {})
    pr_number = pull_request.get("number")
    pr_url = pull_request.get("html_url")
    branch = pull_request.get("head", {}).get("ref")
    
    # Find code generation by branch
    code_gen = db.query(CodeGeneration).filter(
        CodeGeneration.github_branch == branch
    ).first()
    
    if not code_gen:
        print(f"No code generation found for branch {branch}")
        return
    
    # Update based on action
    if action == "opened":
        code_gen.github_pr_number = pr_number
        code_gen.github_pr_url = pr_url
        code_gen.status = CodeGenerationStatus.REVIEW
        
        # Update task
        task = db.query(Task).filter(Task.id == code_gen.task_id).first()
        if task:
            task.current_stage = TaskStage.CODE_REVIEW
        
        print(f"PR #{pr_number} opened for task {code_gen.task_id}")
    
    elif action == "closed" and pull_request.get("merged"):
        code_gen.status = CodeGenerationStatus.MERGED
        
        # Update task
        task = db.query(Task).filter(Task.id == code_gen.task_id).first()
        if task:
            task.current_stage = TaskStage.CD_STAGING
            task.status = TaskStatus.COMPLETED
        
        print(f"PR #{pr_number} merged for task {code_gen.task_id}")
    
    db.commit()


async def handle_workflow_run_event(payload: dict, db: Session):
    """Handle GitHub workflow run events"""
    action = payload.get("action")
    workflow_run = payload.get("workflow_run", {})
    run_id = workflow_run.get("id")
    status = workflow_run.get("status")
    conclusion = workflow_run.get("conclusion")
    
    # This would need more sophisticated logic to map workflow runs to tasks
    # For now, we'll just log it
    print(f"Workflow run {run_id}: status={status}, conclusion={conclusion}")


async def handle_push_event(payload: dict, db: Session):
    """Handle GitHub push events"""
    ref = payload.get("ref")
    commits = payload.get("commits", [])
    
    print(f"Push to {ref} with {len(commits)} commits")
