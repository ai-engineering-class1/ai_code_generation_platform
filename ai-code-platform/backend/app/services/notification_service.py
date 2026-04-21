from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.project import Project
from app.models.task import Task
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: Optional[str] = None,
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    action_url: Optional[str] = None,
    severity: int = 1,
    event_code: Optional[str] = None,
    email_sent: bool = False,
) -> Notification:
    """Create a single in-app notification row."""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        project_id=project_id,
        task_id=task_id,
        action_url=action_url,
        read=False,
        severity=severity,
        event_code=event_code,
        email_sent=email_sent,
    )
    db.add(notification)
    logger.info(
        "[NOTIFICATION] Created notification: notification_id=%s, user_id=%s, type=%s, severity=%s, event=%s, title=%r",
        notification.id,
        user_id,
        notification_type.value,
        severity,
        event_code,
        title,
    )
    return notification


def _task_stakeholder_ids(task: Task, project: Optional[Project]) -> List[str]:
    ids: List[str] = []
    if task.assignee_id:
        ids.append(task.assignee_id)
    if project and project.owner_id and project.owner_id not in ids:
        ids.append(project.owner_id)
    return ids


def notify_task_assigned(db: Session, task: Task, assignee_id: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    dispatch_notification(
        db,
        "task.assigned",
        f"Task Assigned: {task.title}",
        f"You have been assigned to task '{task.title}' in project '{project.name if project else 'Unknown'}'",
        always_include_user_ids=[assignee_id],
        project_id=task.project_id,
        task_id=task.id,
        action_url=action_url,
    )


def notify_task_status_change(db: Session, task: Task, old_status: str, new_status: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    stakeholders = _task_stakeholder_ids(task, project)
    body = f"Task '{task.title}' status changed from {old_status} to {new_status}"

    if new_status == "failed":
        dispatch_notification(
            db,
            "workflow.failed",
            f"Task Failed: {task.title}",
            body,
            always_include_user_ids=stakeholders,
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )
    elif new_status == "blocked":
        dispatch_notification(
            db,
            "task.blocked",
            f"Task Blocked: {task.title}",
            body,
            always_include_user_ids=stakeholders,
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )
    elif new_status == "completed":
        dispatch_notification(
            db,
            "task.completed",
            f"Task Completed: {task.title}",
            body,
            always_include_user_ids=stakeholders,
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )
    else:
        dispatch_notification(
            db,
            "task.status_changed",
            f"Task Status Changed: {task.title}",
            body,
            always_include_user_ids=stakeholders,
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )


def notify_task_stage_change(db: Session, task: Task, old_stage: str, new_stage: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"

    if new_stage == "approval_pending" and project and project.owner_id:
        dispatch_notification(
            db,
            "approval.needed",
            f"Approval Required: {task.title}",
            f"Task '{task.title}' is ready for approval. Please review and approve.",
            trigger_user_id=project.owner_id,
            always_include_user_ids=[project.owner_id],
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )
    elif task.assignee_id:
        dispatch_notification(
            db,
            "task.stage_updated",
            f"Task Stage Updated: {task.title}",
            f"Task '{task.title}' moved from {old_stage} to {new_stage}",
            always_include_user_ids=[task.assignee_id],
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )


def notify_specification_ready(db: Session, task: Task, spec_id: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    if project and project.owner_id:
        dispatch_notification(
            db,
            "spec.review",
            f"Specification Ready for Review: {task.title}",
            f"Specification for task '{task.title}' is ready for your review and approval.",
            trigger_user_id=project.owner_id,
            always_include_user_ids=[project.owner_id],
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )


def notify_specification_approved(db: Session, task: Task, approved_by: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    if task.assignee_id:
        dispatch_notification(
            db,
            "spec.approved",
            f"Specification Approved: {task.title}",
            f"Specification for task '{task.title}' has been approved. You can proceed with code generation.",
            always_include_user_ids=[task.assignee_id],
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )


def notify_jira_sync(db: Session, task: Task, issue_key: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    if project and project.owner_id:
        dispatch_notification(
            db,
            "jira.synced",
            f"Jira Issue Synced: {issue_key}",
            f"Jira issue {issue_key} has been synced and created as task '{task.title}'",
            always_include_user_ids=[project.owner_id],
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )


def notify_ci_cd_failure(db: Session, task: Task, pipeline_type: str, error_message: str):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    stakeholders = _task_stakeholder_ids(task, project)
    dispatch_notification(
        db,
        "ci.failed",
        f"{pipeline_type} Pipeline Failed: {task.title}",
        f"The {pipeline_type} pipeline for task '{task.title}' has failed: {error_message}",
        always_include_user_ids=stakeholders,
        project_id=task.project_id,
        task_id=task.id,
        action_url=action_url,
    )


def notify_code_generation_completed(db: Session, task: Task):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    if task.assignee_id:
        dispatch_notification(
            db,
            "codegen.completed",
            f"Code Generation Completed: {task.title}",
            f"Code generation for task '{task.title}' has been completed successfully.",
            always_include_user_ids=[task.assignee_id],
            project_id=task.project_id,
            task_id=task.id,
            action_url=action_url,
        )


def notify_deployment_status(db: Session, task: Task, environment: str, success: bool):
    from app.services.notification_dispatch import dispatch_notification

    project = db.query(Project).filter(Project.id == task.project_id).first()
    action_url = f"/projects/{task.project_id}/tasks/{task.id}"
    stakeholders = _task_stakeholder_ids(task, project)
    status_text = "succeeded" if success else "failed"
    event = "deploy.succeeded" if success else "deploy.failed"
    dispatch_notification(
        db,
        event,
        f"Deployment {status_text.capitalize()}: {task.title}",
        f"Deployment to {environment} for task '{task.title}' has {status_text}.",
        always_include_user_ids=stakeholders,
        project_id=task.project_id,
        task_id=task.id,
        action_url=action_url,
    )


def dispatch_system_alert(
    db: Session,
    event_code: str,
    title: str,
    message: str,
    action_url: Optional[str] = None,
):
    """
    Level-4 style system alerts (maps to registry e.g. system.queue_down).
    Notifies ops + system admins (+ managers) per L4 rules.
    """
    from app.services.notification_dispatch import dispatch_notification

    dispatch_notification(
        db,
        event_code,
        title,
        message,
        action_url=action_url,
    )
