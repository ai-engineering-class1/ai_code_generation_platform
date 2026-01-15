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
    # Auth
    # - token: Personal Access Token / fine-grained token stored per project
    # - app: GitHub App (App ID + Installation ID + Private Key PEM)
    auth_method = Column(String(20), nullable=False, default="token")
    access_token = Column(Text)  # Encrypted in production
    github_app_id = Column(String(50))
    github_app_installation_id = Column(String(50))
    github_app_private_key = Column(Text)  # Encrypted in production

    branch_prefix = Column(String(50), default="ai-generated")
    auto_merge = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # project = relationship("Project", back_populates="github_config")

    @property
    def has_access_token(self) -> bool:
        return bool(self.access_token)

    @property
    def has_github_app_private_key(self) -> bool:
        return bool(self.github_app_private_key)

