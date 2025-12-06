from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str  # agent, service, feature, bugfix
    priority: Optional[str] = "medium"
    jira_issue_key: Optional[str] = Field(None, alias="jiraIssueKey")
    assignee_id: Optional[str] = Field(None, alias="assigneeId")
    
    @field_validator('jira_issue_key', 'assignee_id', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for optional fields"""
        if v == "":
            return None
        return v
    
    @field_validator('description', mode='before')
    @classmethod
    def process_description(cls, v):
        """Convert empty strings to None and ADF format to plain text"""
        # Handle empty strings
        if v == "":
            return None
        if not v:
            return None
        
        # If it's already a string, return it
        if isinstance(v, str):
            return v
        
        # If it's ADF format (dict), convert to text
        if isinstance(v, dict):
            def extract_text_from_adf(node):
                """Recursively extract text from ADF structure"""
                text_parts = []
                
                if isinstance(node, dict):
                    if node.get("type") == "text":
                        text_parts.append(node.get("text", ""))
                    if "content" in node and isinstance(node["content"], list):
                        for item in node["content"]:
                            text_parts.extend(extract_text_from_adf(item))
                elif isinstance(node, list):
                    for item in node:
                        text_parts.extend(extract_text_from_adf(item))
                
                return text_parts
            
            text_parts = extract_text_from_adf(v)
            return "\n".join(text_parts) if text_parts else None
        
        # Fallback: convert to string
        return str(v) if v else None
    
    class Config:
        populate_by_name = True  # Allow both alias and original name


class TaskCreate(TaskBase):
    # project_id is not needed here since it comes from the URL path
    pass


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
    metadata: Optional[dict] = Field(None, alias="workflow_metadata")
    created_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True  # Allow both alias and original name


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

