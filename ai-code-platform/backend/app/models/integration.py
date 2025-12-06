from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class JiraConfiguration(Base):
    __tablename__ = "jira_configurations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    jira_url = Column(String(500), nullable=False)
    jira_project_key = Column(String(50), nullable=False)
    jira_email = Column(String(255), nullable=False)  # Email for Basic auth
    access_token = Column(Text)  # API token - Encrypted in production
    webhook_secret = Column(String(255))
    sync_enabled = Column(Boolean, default=True)
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # project = relationship("Project", back_populates="jira_config")


class GitHubConfiguration(Base):
    __tablename__ = "github_configurations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    repo_owner = Column(String(255), nullable=False)
    repo_name = Column(String(255), nullable=False)
    access_token = Column(Text)  # Encrypted in production
    branch_prefix = Column(String(50), default="ai-generated")
    auto_merge = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # project = relationship("Project", back_populates="github_config")

