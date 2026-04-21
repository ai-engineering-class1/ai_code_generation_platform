"""
Event registry for notification severity (L1–L4), recipient routing, and email policy.
"""
from dataclasses import dataclass
from typing import Dict, FrozenSet, Optional

from app.models.notification import NotificationType


@dataclass(frozen=True)
class EventConfig:
    """Defines how an event is classified and who gets email."""

    level: int  # 1 info/success, 2 warning, 3 error, 4 critical
    # Level 2 only: also notify Ops in-app/email when True (e.g. external API timeout)
    notify_ops_on_l2: bool = False


# Level-2 events that always trigger email (urgent / action needed / may be missed offline)
L2_EMAIL_EVENTS: FrozenSet[str] = frozenset(
    {
        "approval.needed",
        "spec.review",
        "task.blocked",
        "retry.exhausted",
        "permission.blocking",
        "webhook.processing_failed",
    }
)  # task.blocked: urgent / may block workflow offline

# Level-1 events that also send email to core recipients (assignee/owner only; no Manager fan-out)
# when SMTP is configured — useful for milestones users may miss when offline.
L1_EMAIL_EVENTS: FrozenSet[str] = frozenset(
    {
        "task.assigned",
        "task.completed",
        "github.pr_merged",
        "workflow.completed",
    }
)

# Default for unknown event codes (in-app only, info)
DEFAULT_EVENT_CONFIG = EventConfig(level=1, notify_ops_on_l2=False)

EVENT_REGISTRY: Dict[str, EventConfig] = {
    # --- Level 1: routine info; email only for codes in L1_EMAIL_EVENTS when SMTP is set ---
    "task.assigned": EventConfig(level=1),
    "task.completed": EventConfig(level=1),
    "pr.created": EventConfig(level=1),
    "workflow.completed": EventConfig(level=1),
    "github.pr": EventConfig(level=1),
    "github.pr_merged": EventConfig(level=1),
    "github.push": EventConfig(level=1),
    "github.workflow_success": EventConfig(level=1),
    "github.workflow_neutral": EventConfig(level=1),
    "github.generic": EventConfig(level=1),
    "jira.synced": EventConfig(level=1),
    "codegen.completed": EventConfig(level=1),
    "spec.approved": EventConfig(level=1),
    "task.stage_updated": EventConfig(level=1),
    "task.status_changed": EventConfig(level=1),
    "deploy.succeeded": EventConfig(level=1),
    "notification.sent": EventConfig(level=1),
    # --- Level 2: warning / action needed ---
    "retry.started": EventConfig(level=2, notify_ops_on_l2=False),
    "job.delayed": EventConfig(level=2, notify_ops_on_l2=False),
    "partial.failure": EventConfig(level=2, notify_ops_on_l2=True),
    "api.timeout": EventConfig(level=2, notify_ops_on_l2=True),
    "task.blocked": EventConfig(level=2, notify_ops_on_l2=False),
    # --- Level 3: failures (in-app + email for routed recipients) ---
    "workflow.failed": EventConfig(level=3),
    "github.workflow_failed": EventConfig(level=3),
    "webhook.failed": EventConfig(level=3),
    "webhook.processing_failed": EventConfig(level=3),
    "ci.failed": EventConfig(level=3),
    "deploy.failed": EventConfig(level=3),
    "jira.sync_failed": EventConfig(level=3),
    # --- Level 4: critical / system ---
    "system.rbac_broken": EventConfig(level=4),
    "system.db_unavailable": EventConfig(level=4),
    "system.outage": EventConfig(level=4),
    "system.auth_failure": EventConfig(level=4),
    "system.queue_down": EventConfig(level=4),
}


def get_event_config(event_code: str) -> EventConfig:
    return EVENT_REGISTRY.get(event_code, DEFAULT_EVENT_CONFIG)


def notification_type_for_level(level: int) -> NotificationType:
    # severity column distinguishes L3 vs L4; type stays ERROR for both (no DB enum change)
    if level >= 3:
        return NotificationType.ERROR
    if level >= 2:
        return NotificationType.WARNING
    return NotificationType.INFO


def should_send_email(event_code: str, config: EventConfig) -> bool:
    """Email for L3+, L4, selected L2, and allowlisted L1 (stakeholder milestones)."""
    if config.level >= 4:
        return True
    if config.level >= 3:
        return True
    if config.level == 2:
        if event_code in L2_EMAIL_EVENTS:
            return True
        if config.notify_ops_on_l2:
            return True
        return False
    if config.level == 1:
        return event_code in L1_EMAIL_EVENTS
    return False


def include_managers_for_level(level: int) -> bool:
    return level >= 2


def include_ops_for_level(level: int, config: EventConfig) -> bool:
    if level >= 3:
        return True
    if level == 2 and config.notify_ops_on_l2:
        return True
    return False


def include_system_admins_for_level(level: int) -> bool:
    return level >= 4
