from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from typing import Optional, List


def create_notification(
    db: Session,
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: Optional[str] = None,
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    action_url: Optional[str] = None
) -> Notification:
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        project_id=project_id,
        task_id=task_id,
        action_url=action_url,
        read=False
    )
    db.add(notification)
    return notification


def notify_task_assigned(
    db: Session,
    task: Task,
    assignee_id: str
):
    """Notify user when assigned to a task"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    create_notification(
        db=db,
        user_id=assignee_id,
        notification_type=NotificationType.INFO,
        title=f"Task Assigned: {task.title}",
        message=f"You have been assigned to task '{task.title}' in project '{project.name if project else 'Unknown'}'",
        project_id=task.project_id,
        task_id=task.id,
        action_url=action_url
    )


def notify_task_status_change(
    db: Session,
    task: Task,
    old_status: str,
    new_status: str
):
    """Notify relevant users when task status changes"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    # Determine notification type based on status
    if new_status == "failed":
        notification_type = NotificationType.ERROR
    elif new_status == "blocked":
        notification_type = NotificationType.WARNING
    else:
        notification_type = NotificationType.INFO
    
    # Notify assignee if exists
    if task.assignee_id:
        create_notification(
            db=db,
            user_id=task.assignee_id,
            notification_type=notification_type,
            title=f"Task Status Changed: {task.title}",
            message=f"Task '{task.title}' status changed from {old_status} to {new_status}",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )
    
    # Notify project owner
    if project and project.owner_id:
        create_notification(
            db=db,
            user_id=project.owner_id,
            notification_type=notification_type,
            title=f"Task Status Changed: {task.title}",
            message=f"Task '{task.title}' status changed from {old_status} to {new_status}",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )


def notify_task_stage_change(
    db: Session,
    task: Task,
    old_stage: str,
    new_stage: str
):
    """Notify when task moves to approval_pending stage"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    if new_stage == "approval_pending":
        # Notify project owner for approval
        if project and project.owner_id:
            create_notification(
                db=db,
                user_id=project.owner_id,
                notification_type=NotificationType.APPROVAL_REQUIRED,
                title=f"Approval Required: {task.title}",
                message=f"Task '{task.title}' is ready for approval. Please review and approve.",
                project_id=task.project_id,
                task_id=task.id,
                action_url=action_url
            )
    else:
        # Notify assignee of stage change
        if task.assignee_id:
            create_notification(
                db=db,
                user_id=task.assignee_id,
                notification_type=NotificationType.INFO,
                title=f"Task Stage Updated: {task.title}",
                message=f"Task '{task.title}' moved from {old_stage} to {new_stage}",
                project_id=task.project_id,
                task_id=task.id,
                action_url=action_url
            )


def notify_specification_ready(
    db: Session,
    task: Task,
    spec_id: str
):
    """Notify when specification is ready for review"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    # Notify project owner
    if project and project.owner_id:
        create_notification(
            db=db,
            user_id=project.owner_id,
            notification_type=NotificationType.APPROVAL_REQUIRED,
            title=f"Specification Ready for Review: {task.title}",
            message=f"Specification for task '{task.title}' is ready for your review and approval.",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )


def notify_specification_approved(
    db: Session,
    task: Task,
    approved_by: str
):
    """Notify when specification is approved"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    # Notify task assignee
    if task.assignee_id:
        create_notification(
            db=db,
            user_id=task.assignee_id,
            notification_type=NotificationType.INFO,
            title=f"Specification Approved: {task.title}",
            message=f"Specification for task '{task.title}' has been approved. You can proceed with code generation.",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )


def notify_jira_sync(
    db: Session,
    task: Task,
    issue_key: str
):
    """Notify when Jira issue is synced"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    # Notify project owner
    if project and project.owner_id:
        create_notification(
            db=db,
            user_id=project.owner_id,
            notification_type=NotificationType.INFO,
            title=f"Jira Issue Synced: {issue_key}",
            message=f"Jira issue {issue_key} has been synced and created as task '{task.title}'",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )


def notify_ci_cd_failure(
    db: Session,
    task: Task,
    pipeline_type: str,
    error_message: str
):
    """Notify on CI/CD pipeline failures"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    recipients = []
    if task.assignee_id:
        recipients.append(task.assignee_id)
    if project and project.owner_id and project.owner_id not in recipients:
        recipients.append(project.owner_id)
    
    for user_id in recipients:
        create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.ERROR,
            title=f"{pipeline_type} Pipeline Failed: {task.title}",
            message=f"The {pipeline_type} pipeline for task '{task.title}' has failed: {error_message}",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )


def notify_code_generation_completed(
    db: Session,
    task: Task
):
    """Notify when code generation is completed"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    # Notify task assignee
    if task.assignee_id:
        create_notification(
            db=db,
            user_id=task.assignee_id,
            notification_type=NotificationType.INFO,
            title=f"Code Generation Completed: {task.title}",
            message=f"Code generation for task '{task.title}' has been completed successfully.",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )


def notify_deployment_status(
    db: Session,
    task: Task,
    environment: str,
    success: bool
):
    """Notify on deployment status changes"""
    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    
    notification_type = NotificationType.INFO if success else NotificationType.ERROR
    status_text = "succeeded" if success else "failed"
    
    recipients = []
    if task.assignee_id:
        recipients.append(task.assignee_id)
    if project and project.owner_id and project.owner_id not in recipients:
        recipients.append(project.owner_id)
    
    for user_id in recipients:
        create_notification(
            db=db,
            user_id=user_id,
            notification_type=notification_type,
            title=f"Deployment {status_text.capitalize()}: {task.title}",
            message=f"Deployment to {environment} for task '{task.title}' has {status_text}.",
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url
        )

