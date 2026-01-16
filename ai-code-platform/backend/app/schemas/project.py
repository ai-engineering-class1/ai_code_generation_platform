from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    jira_project_key: Optional[str] = None
    github_repo_url: Optional[str] = None
    organization_id: Optional[str] = None # Optional for creation (defaults to user's org)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    jira_project_key: Optional[str] = None
    github_repo_url: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: str
    owner_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    priority: Optional[str] = "medium"
    jira_issue_key: Optional[str] = None


class TaskCreate(TaskBase):
    project_id: str
    assignee_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    current_stage: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None


class TaskResponse(TaskBase):
    id: str
    project_id: str
    status: str
    current_stage: str
    assignee_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

