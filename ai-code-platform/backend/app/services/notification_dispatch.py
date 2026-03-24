"""
Central dispatch: resolves recipients by severity (L1–L4), creates in-app notifications,
and sends email when policy requires it.
"""
import logging
from typing import Collection, Optional, Set

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import UserRoleAssignment
from app.models.rbac import Role
from app.models.user import User
from app.services.email_service import send_notification_email
from app.services.notification_events import (
    get_event_config,
    include_managers_for_level,
    include_ops_for_level,
    include_system_admins_for_level,
    notification_type_for_level,
    should_send_email,
)
from app.core.config import settings
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)

ROLE_MANAGER = "Manager"
ROLE_OPS = "Ops"
ROLE_SYSTEM_ADMIN = "System Admin"


def _active_user_ids_with_roles(db: Session, role_names: Collection[str]) -> Set[str]:
    if not role_names:
        return set()
    stmt = (
        select(User.id)
        .join(UserRoleAssignment, UserRoleAssignment.user_id == User.id)
        .join(Role, Role.id == UserRoleAssignment.role_id)
        .where(Role.name.in_(list(role_names)))
        .where(User.is_active.is_(True))
    )
    return {row[0] for row in db.execute(stmt).all()}


def dispatch_notification(
    db: Session,
    event_code: str,
    title: str,
    message: Optional[str],
    *,
    trigger_user_id: Optional[str] = None,
    always_include_user_ids: Optional[Collection[str]] = None,
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    action_url: Optional[str] = None,
    additional_in_app_user_ids: Optional[Collection[str]] = None,
    commit: bool = True,
) -> int:
    """
    Fan-out notifications according to event severity and email policy.

    - Core recipients (trigger user, managers, ops, system admins) follow L1–L4 rules.
    - additional_in_app_user_ids: extra users who receive in-app only (e.g. broadcast PR opened).
    Returns count of in-app notifications created.
    """
    config = get_event_config(event_code)
    level = config.level
    ntype = notification_type_for_level(level)

    core: Set[str] = set()
    for uid in always_include_user_ids or []:
        if not uid:
            continue
        u = db.query(User).filter(User.id == uid, User.is_active.is_(True)).first()
        if u:
            core.add(uid)
    if trigger_user_id:
        u = db.query(User).filter(User.id == trigger_user_id, User.is_active.is_(True)).first()
        if u:
            core.add(trigger_user_id)

    if include_managers_for_level(level):
        core |= _active_user_ids_with_roles(db, [ROLE_MANAGER])

    if include_ops_for_level(level, config):
        core |= _active_user_ids_with_roles(db, [ROLE_OPS])

    if include_system_admins_for_level(level):
        core |= _active_user_ids_with_roles(db, [ROLE_SYSTEM_ADMIN])

    in_app = set(core)
    if additional_in_app_user_ids:
        for uid in additional_in_app_user_ids:
            if not uid:
                continue
            u = db.query(User).filter(User.id == uid, User.is_active.is_(True)).first()
            if u:
                in_app.add(uid)

    send_email = should_send_email(event_code, config)
    email_targets = set(core) if send_email else set()

    # Full URL for email links
    full_action = None
    if action_url:
        if action_url.startswith("http"):
            full_action = action_url
        else:
            base = settings.APP_PUBLIC_URL.rstrip("/")
            path = action_url if action_url.startswith("/") else f"/{action_url}"
            full_action = f"{base}{path}"

    count = 0
    for uid in in_app:
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            continue
        email_ok = uid in email_targets and user.email
        n = create_notification(
            db=db,
            user_id=uid,
            notification_type=ntype,
            title=title,
            message=message,
            project_id=project_id,
            task_id=task_id,
            action_url=action_url,
            severity=level,
            event_code=event_code,
            email_sent=False,
        )
        count += 1
        if email_ok:
            sent = send_notification_email(
                to_email=user.email,
                subject=f"[{event_code}] {title}",
                body_text=message or title,
                action_url=full_action,
            )
            if sent:
                n.email_sent = True

    if commit:
        db.commit()
    logger.info(
        "[DISPATCH] event=%s level=%s in_app=%s email=%s created=%s",
        event_code,
        level,
        len(in_app),
        len(email_targets),
        count,
    )
    return count
