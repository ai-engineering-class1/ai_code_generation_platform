# Models package
# Import all models to ensure they're registered with SQLAlchemy

from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskType, TaskPriority, TaskStatus, TaskStage, TaskWorkflowHistory
from app.models.notification import Notification, NotificationType, AuditLog
from app.models.integration import JiraConfiguration, GitHubConfiguration
from app.models.workflow import Specification, CodeGeneration, CodeGenerationStatus, TaskBranchRegistry, PipelineExecution, PipelineType, PipelineStatus
from app.models.organization import Organization, OrganizationType, UserRoleAssignment, OrganizationPolicy
from app.models.rbac import Permission, PermissionType, Role, RolePermission

__all__ = [
    "User", "UserRole",
    "Project", "ProjectStatus",
    "Task", "TaskType", "TaskPriority", "TaskStatus", "TaskStage",
    "Notification", "NotificationType", "TaskWorkflowHistory", "AuditLog",
    "JiraConfiguration", "GitHubConfiguration",
    "Specification", "CodeGeneration", "CodeGenerationStatus", "TaskBranchRegistry",
    "PipelineExecution", "PipelineType", "PipelineStatus",
    "Organization", "OrganizationType", "UserRoleAssignment", "OrganizationPolicy",
    "Permission", "PermissionType", "Role", "RolePermission",
]

