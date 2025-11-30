from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class TaskType(str, enum.Enum):
    AGENT = "agent"
    SERVICE = "service"
    FEATURE = "feature"
    BUGFIX = "bugfix"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStage(str, enum.Enum):
    REQUIREMENT = "requirement"
    SPEC_GENERATION = "spec_generation"
    SPEC_REVIEW = "spec_review"
    CODE_GENERATION = "code_generation"
    PR_CREATED = "pr_created"
    CODE_REVIEW = "code_review"
    CI_RUNNING = "ci_running"
    CD_STAGING = "cd_staging"
    APPROVAL_PENDING = "approval_pending"
    CD_PRODUCTION = "cd_production"
    DEPLOYED = "deployed"
    FAILED = "failed"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    jira_issue_key = Column(String(50))
    title = Column(String(500), nullable=False)
    description = Column(Text)
    type = Column(Enum(TaskType), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    current_stage = Column(Enum(TaskStage), default=TaskStage.REQUIREMENT)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    assignee_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])

