from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, JSON, Boolean, text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy import Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Dict, Set
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


ALLOWED: Dict[TaskStatus, Set[TaskStatus]] = {
    TaskStatus.IN_PROGRESS: {TaskStatus.BLOCKED, TaskStatus.COMPLETED, TaskStatus.FAILED},
    TaskStatus.PENDING: {TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED},
    TaskStatus.BLOCKED: {TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED},
    TaskStatus.COMPLETED: set(),
    TaskStatus.FAILED: set(),
    TaskStatus.CANCELLED: set(),
}

def can_transition(src: TaskStatus, dst: TaskStatus) -> bool:
    return dst in ALLOWED.get(src, set())

def transition(current: TaskStatus, dst: TaskStatus) -> TaskStatus:
    if can_transition(current, dst):
        return dst
    # Allow self-transition (updating other fields but keeping status same)
    if current == dst:
        return dst
    raise ValueError(f"invalid transition {current} -> {dst}")


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
    PENDING_USER_INPUT = "pending_user_input"
    COMPLETED = "completed"
    FAILED = "failed"
    TRANSFERRED = "transferred"


ACTIVITY_ALLOWED: Dict[ActivityStatus, Set[ActivityStatus]] = {
    ActivityStatus.IN_PROGRESS: {ActivityStatus.PENDING_USER_INPUT, ActivityStatus.COMPLETED, ActivityStatus.FAILED, ActivityStatus.TRANSFERRED},
    ActivityStatus.PENDING_USER_INPUT: {ActivityStatus.IN_PROGRESS, ActivityStatus.COMPLETED, ActivityStatus.FAILED, ActivityStatus.TRANSFERRED},
    ActivityStatus.COMPLETED: set(),
    ActivityStatus.FAILED: set(),
    ActivityStatus.TRANSFERRED: set(),
}

def can_activity_transition(src: ActivityStatus, dst: ActivityStatus) -> bool:
    return dst in ACTIVITY_ALLOWED.get(src, set())

def transition_activity(current: ActivityStatus, dst: ActivityStatus) -> ActivityStatus:
    if can_activity_transition(current, dst):
        return dst
    # Allow self-transition
    if current == dst:
        return dst
    raise ValueError(f"invalid activity transition {current} -> {dst}")


ACTIVITY_ALLOWED: Dict[ActivityStatus, Set[ActivityStatus]] = {
    ActivityStatus.IN_PROGRESS: {ActivityStatus.PENDING_USER_INPUT, ActivityStatus.COMPLETED, ActivityStatus.FAILED},
    ActivityStatus.PENDING_USER_INPUT: {ActivityStatus.IN_PROGRESS, ActivityStatus.COMPLETED, ActivityStatus.FAILED},
    ActivityStatus.COMPLETED: set(),
    ActivityStatus.FAILED: set(),
}

def can_activity_transition(src: ActivityStatus, dst: ActivityStatus) -> bool:
    return dst in ACTIVITY_ALLOWED.get(src, set())

def transition_activity(current: ActivityStatus, dst: ActivityStatus) -> ActivityStatus:
    if can_activity_transition(current, dst):
        return dst
    # Allow self-transition
    if current == dst:
        return dst
    raise ValueError(f"invalid activity transition {current} -> {dst}")


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

    @property
    def allowed_transitions(self) -> list[str]:
        """
        Returns list of allowed status values to transition to from current status.
        Always includes the current status.
        """
        # Ensure we have the enum value
        current = self.status
        # If it's a string, try to convert to Enum
        if isinstance(current, str):
            try:
                current = TaskStatus(current)
            except ValueError:
                # If invalid status in DB, allow all or none? 
                # Let's return just current string to be safe
                return [self.status]
        
        allowed_set = ALLOWED.get(current, set())
        # Convert enums to strings
        result = [s.value for s in allowed_set]
        # Include current status
        if current.value not in result:
            result.append(current.value)
        return result


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
    activity_end_at = Column(DateTime(timezone=True), nullable=True)
    
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
        Index('ix_task_hist_task_start', 'task_id', text("activity_start_at DESC")),
        Index('ix_task_hist_task_end', 'task_id', text("activity_end_at DESC")),
        Index('ix_task_workflow_history_search_vector', 'search_vector', postgresql_using='gin'),
    )

    @property
    def allowed_transitions(self) -> list[str]:
        """
        Returns list of allowed status values to transition to from current status.
        Always includes the current status.
        """
        # Ensure we have the enum value
        current = self.status
        # If it's a string, try to convert to Enum
        if isinstance(current, str):
            try:
                current = ActivityStatus(current)
            except ValueError:
                return [self.status]
        
        allowed_set = ACTIVITY_ALLOWED.get(current, set())
        # Convert enums to strings
        result = [s.value for s in allowed_set]
        # Include current status
        if current.value not in result:
            result.append(current.value)
        return result

