from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CamelCaseModel(BaseModel):
    class Config:
        allow_population_by_field_name = True
        populate_by_name = True
        orm_mode = True


class JiraConfigBase(CamelCaseModel):
    jira_url: str = Field(..., alias="jiraUrl")
    jira_project_key: str = Field(..., alias="jiraProjectKey")
    jira_email: str = Field(..., alias="jiraEmail")
    sync_enabled: Optional[bool] = Field(True, alias="syncEnabled")


class JiraConfigCreate(JiraConfigBase):
    project_id: str = Field(..., alias="projectId")
    access_token: str = Field(..., alias="accessToken")
    webhook_secret: Optional[str] = Field(None, alias="webhookSecret")


class JiraConfigUpdate(CamelCaseModel):
    jira_url: Optional[str] = Field(None, alias="jiraUrl")
    jira_project_key: Optional[str] = Field(None, alias="jiraProjectKey")
    jira_email: Optional[str] = Field(None, alias="jiraEmail")
    access_token: Optional[str] = Field(None, alias="accessToken")
    sync_enabled: Optional[bool] = Field(None, alias="syncEnabled")


class JiraConfigResponse(JiraConfigBase):
    id: str
    project_id: str = Field(..., alias="projectId")
    last_sync_at: Optional[datetime] = Field(None, alias="lastSyncAt")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


class GitHubConfigBase(CamelCaseModel):
    repo_owner: str = Field(..., alias="repoOwner")
    repo_name: str = Field(..., alias="repoName")
    branch_prefix: Optional[str] = Field("ai-generated", alias="branchPrefix")
    auto_merge: Optional[bool] = Field(False, alias="autoMerge")


class GitHubConfigCreate(GitHubConfigBase):
    project_id: str = Field(..., alias="projectId")
    access_token: Optional[str] = Field(None, alias="accessToken")


class GitHubConfigUpdate(CamelCaseModel):
    repo_owner: Optional[str] = Field(None, alias="repoOwner")
    repo_name: Optional[str] = Field(None, alias="repoName")
    access_token: Optional[str] = Field(None, alias="accessToken")
    branch_prefix: Optional[str] = Field(None, alias="branchPrefix")
    auto_merge: Optional[bool] = Field(None, alias="autoMerge")


class GitHubConfigResponse(GitHubConfigBase):
    id: str
    project_id: str = Field(..., alias="projectId")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

