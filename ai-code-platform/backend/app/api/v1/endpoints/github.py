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
from app.services.notification_service import create_notification
from app.models.notification import NotificationType
from app.models.user import User
from datetime import datetime
import hmac
import hashlib

router = APIRouter()


async def notify_webhook_event(db: Session, event_type: str, action: str, payload: dict):
    """Create notifications for all users when webhook events are received"""
    try:
        # Get all active users to notify them
        users = db.query(User).filter(User.is_active == True).all()
        
        # Determine notification details based on event type
        if event_type == "pull_request":
            pull_request = payload.get("pull_request", {})
            pr_number = pull_request.get("number")
            pr_title = pull_request.get("title", "Untitled PR")
            pr_url = pull_request.get("html_url", "")
            repository = payload.get("repository", {})
            repo_name = repository.get("full_name", "Unknown")
            
            if action == "opened":
                title = f"New Pull Request: #{pr_number}"
                message = f"Pull request opened in {repo_name}: {pr_title}"
            elif action == "closed":
                if pull_request.get("merged"):
                    title = f"Pull Request Merged: #{pr_number}"
                    message = f"Pull request #{pr_number} was merged in {repo_name}"
                else:
                    title = f"Pull Request Closed: #{pr_number}"
                    message = f"Pull request #{pr_number} was closed in {repo_name}"
            else:
                title = f"Pull Request Updated: #{pr_number}"
                message = f"Pull request #{pr_number} was {action} in {repo_name}"
            
            notification_type = NotificationType.INFO
            action_url = pr_url if pr_url else None
            
        elif event_type == "workflow_run":
            workflow_run = payload.get("workflow_run", {})
            workflow_name = workflow_run.get("name", "Workflow")
            conclusion = workflow_run.get("conclusion", "unknown")
            repository = payload.get("repository", {})
            repo_name = repository.get("full_name", "Unknown")
            
            if conclusion == "success":
                title = f"Workflow Succeeded: {workflow_name}"
                message = f"Workflow '{workflow_name}' completed successfully in {repo_name}"
                notification_type = NotificationType.INFO
            elif conclusion == "failure":
                title = f"Workflow Failed: {workflow_name}"
                message = f"Workflow '{workflow_name}' failed in {repo_name}"
                notification_type = NotificationType.ERROR
            else:
                title = f"Workflow {action}: {workflow_name}"
                message = f"Workflow '{workflow_name}' {action} in {repo_name}"
                notification_type = NotificationType.INFO
            
            action_url = workflow_run.get("html_url", "")
            
        elif event_type == "push":
            ref = payload.get("ref", "")
            commits = payload.get("commits", [])
            repository = payload.get("repository", {})
            repo_name = repository.get("full_name", "Unknown")
            branch = ref.replace("refs/heads/", "") if ref.startswith("refs/heads/") else ref
            
            commit_count = len(commits)
            if commit_count > 0:
                last_commit = commits[0]
                commit_message = last_commit.get("message", "No message")
                title = f"Push to {branch}"
                message = f"{commit_count} commit(s) pushed to {branch} in {repo_name}: {commit_message[:50]}"
            else:
                title = f"Push to {branch}"
                message = f"Push event to {branch} in {repo_name}"
            
            notification_type = NotificationType.INFO
            action_url = repository.get("html_url", "")
            
        else:
            # Generic webhook event
            title = f"GitHub Webhook: {event_type}"
            message = f"Received {event_type} event" + (f" (action: {action})" if action else "")
            notification_type = NotificationType.INFO
            action_url = None
        
        # Create notification for each active user
        for user in users:
            create_notification(
                db=db,
                user_id=user.id,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url
            )
        
        db.commit()
        print(f"Created webhook notification for {len(users)} users: {event_type} - {action}")
        
    except Exception as e:
        print(f"Error creating webhook notification: {e}")
        db.rollback()


@router.post("/config", response_model=GitHubConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_github_config(
    config_data: GitHubConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Configure GitHub integration for a project"""
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
    existing_config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == config_data.project_id
    ).first()
    
    incoming = config_data.model_dump(exclude_unset=True)

    # Normalize auth method
    auth_method = (incoming.get("auth_method") or "token").strip().lower()
    if auth_method not in {"token", "app"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="authMethod must be either 'token' or 'app'"
        )
    incoming["auth_method"] = auth_method

    def _has_token_payload(payload: dict) -> bool:
        token = payload.get("access_token")
        return bool(token and str(token).strip())

    def _has_app_payload(payload: dict) -> bool:
        return bool(
            (payload.get("github_app_id") and str(payload.get("github_app_id")).strip())
            and (payload.get("github_app_installation_id") and str(payload.get("github_app_installation_id")).strip())
            and (payload.get("github_app_private_key") and str(payload.get("github_app_private_key")).strip())
        )

    if existing_config:
        # Update existing config
        # Don't overwrite secrets unless provided
        if not _has_token_payload(incoming):
            incoming.pop("access_token", None)
        if not (incoming.get("github_app_id") and str(incoming.get("github_app_id")).strip()):
            incoming.pop("github_app_id", None)
        if not (incoming.get("github_app_installation_id") and str(incoming.get("github_app_installation_id")).strip()):
            incoming.pop("github_app_installation_id", None)
        if not (incoming.get("github_app_private_key") and str(incoming.get("github_app_private_key")).strip()):
            incoming.pop("github_app_private_key", None)

        for field, value in incoming.items():
            setattr(existing_config, field, value)

        # Validate resulting config (after update)
        if existing_config.auth_method == "token" and not existing_config.access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token auth selected but no access token is set"
            )
        if existing_config.auth_method == "app":
            missing = []
            if not existing_config.github_app_id:
                missing.append("githubAppId")
            if not existing_config.github_app_installation_id:
                missing.append("githubAppInstallationId")
            if not existing_config.github_app_private_key:
                missing.append("githubAppPrivateKey")
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub App auth selected but missing: {', '.join(missing)}"
                )

        db.commit()
        db.refresh(existing_config)
        return existing_config

    # Creating new config: must provide either token or full app creds
    if auth_method == "token" and not _has_token_payload(incoming):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="accessToken is required when authMethod is 'token'"
        )
    if auth_method == "app" and not _has_app_payload(incoming):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="githubAppId, githubAppInstallationId, and githubAppPrivateKey are required when authMethod is 'app'"
        )

    new_config = GitHubConfiguration(**incoming)
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
        Project.id == project_id
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
        Project.id == task.project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Generate specification using Claude
    try:
        claude_service = ClaudeService()
        # Handle task.type - it might be an enum or a string
        task_type = task.type.value if hasattr(task.type, 'value') else str(task.type)
        spec_content = await claude_service.generate_specification(
            task.title,
            task.description or "",
            task_type
        )
        
        if not spec_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate specification: Claude API returned empty response"
            )
    except ValueError as e:
        # Configuration error (e.g., missing API key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration error: {str(e)}"
        )
    except Exception as e:
        # Other errors from Claude service
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate specification: {str(e)}"
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
        Project.id == task.project_id
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
        
        # Create notification for webhook event
        await notify_webhook_event(db, event_type, action, payload)
        
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
