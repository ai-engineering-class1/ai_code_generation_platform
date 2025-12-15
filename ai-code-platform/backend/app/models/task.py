from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, JSON, Boolean
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy import Index
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


class ActivityStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


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
    specifications = relationship("Specification", back_populates="task")  # One-to-many: task can have multiple spec versions
    code_generations = relationship("CodeGeneration", back_populates="task")  # One-to-many: task can have multiple code generations
    workflow_history = relationship("TaskWorkflowHistory", back_populates="task")


class TaskWorkflowHistory(Base):
    __tablename__ = "task_workflow_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    
    # Workflow transitions
    from_stage = Column(String(50))
    to_stage = Column(String(50))
    status = Column(String(50)) # Kept as String for backward compatibility with older data, but logically mapped to ActivityStatus
    
    # Operator info
    operator_id = Column(String)
    
    # Timing
    activity_start_at = Column(DateTime(timezone=True), server_default=func.now())
    activity_end_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # STAR Framework
    situation = Column(Text)
    task_role = Column(Text) # Renamed from 'task' to avoid conflict
    action = Column(Text)
    title = Column(String(255))
    result = Column(Text)
    tie_back = Column(Text)
    
    # RAG / Knowledge Base (Fields removed as per user request to stop RAG implementation)

    
    # Metadata
    activity_type = Column(String(50))
    is_public = Column(Boolean, default=True)
    workflow_metadata = Column("workflow_metadata", JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Full Text Search
    search_vector = Column(TSVECTOR)
    
    # Relationships
    task = relationship("Task", back_populates="workflow_history")

    __table_args__ = (
        Index('ix_task_workflow_history_activity_end_at', 'activity_end_at'),
        Index('ix_task_workflow_history_search_vector', 'search_vector', postgresql_using='gin'),
    )

