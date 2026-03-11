from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean, Integer, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class Specification(Base):
    __tablename__ = "specifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    content = Column(Text, nullable=False)
    github_file_url = Column(String(500))
    version = Column(Integer, default=1)
    approved = Column(Boolean, default=False)
    approved_by = Column(String, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="specifications")
    code_generations = relationship("CodeGeneration", back_populates="specification")


class CodeGenerationStatus(str, enum.Enum):
    GENERATING = "generating"
    REVIEW = "review"
    APPROVED = "approved"
    MERGED = "merged"
    FAILED = "failed"


class CodeGeneration(Base):
    __tablename__ = "code_generations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    specification_id = Column(String, ForeignKey("specifications.id"), nullable=False)
    github_branch = Column(String(255))
    github_pr_number = Column(Integer)
    github_pr_url = Column(String(500))
    status = Column(Enum(CodeGenerationStatus), default=CodeGenerationStatus.GENERATING)
    code_review_feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="code_generations")
    specification = relationship("Specification", back_populates="code_generations")
    pipeline_executions = relationship("PipelineExecution", back_populates="code_generation")


class PipelineType(str, enum.Enum):
    CI = "ci"
    CD = "cd"


class PipelineStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class TaskBranchRegistry(Base):
    """Maps a branch name to a task for webhook matching. Used when task has no Specification (so we can't use code_generations)."""
    __tablename__ = "task_branch_registry"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    branch_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # One task can have multiple branches registered (e.g. retries with different branch names)
    __table_args__ = ()


class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code_generation_id = Column(String, ForeignKey("code_generations.id"), nullable=False)
    pipeline_type = Column(Enum(PipelineType), nullable=False)
    github_run_id = Column(String)
    status = Column(Enum(PipelineStatus), default=PipelineStatus.PENDING)
    logs = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    code_generation = relationship("CodeGeneration", back_populates="pipeline_executions")

