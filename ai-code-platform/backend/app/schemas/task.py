from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str  # agent, service, feature, bugfix
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


class SpecificationBase(BaseModel):
    content: str
    github_file_url: Optional[str] = None


class SpecificationCreate(SpecificationBase):
    task_id: str


class SpecificationResponse(SpecificationBase):
    id: str
    task_id: str
    version: int
    approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CodeGenerationResponse(BaseModel):
    id: str
    task_id: str
    specification_id: str
    github_branch: Optional[str] = None
    github_pr_number: Optional[int] = None
    github_pr_url: Optional[str] = None
    status: str
    code_review_feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class WorkflowHistoryResponse(BaseModel):
    id: str
    task_id: str
    from_stage: Optional[str] = None
    to_stage: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PipelineExecutionResponse(BaseModel):
    id: str
    code_generation_id: str
    pipeline_type: str  # ci or cd
    github_run_id: Optional[str] = None
    status: str
    logs: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TaskDetailResponse(TaskResponse):
    """Extended task response with related entities"""
    specification: Optional[SpecificationResponse] = None
    code_generation: Optional[CodeGenerationResponse] = None
    workflow_history: List[WorkflowHistoryResponse] = []

