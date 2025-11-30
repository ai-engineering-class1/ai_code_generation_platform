from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TriggerCodeGenerationRequest(BaseModel):
    task_id: str
    specification_id: str


class ApproveSpecificationRequest(BaseModel):
    specification_id: str


class ApproveDeploymentRequest(BaseModel):
    pipeline_execution_id: str


class WebhookJiraPayload(BaseModel):
    """Jira webhook payload"""
    webhookEvent: str
    issue: dict
    user: Optional[dict] = None
    changelog: Optional[dict] = None


class WebhookGitHubPayload(BaseModel):
    """GitHub webhook payload"""
    action: str
    pull_request: Optional[dict] = None
    workflow_run: Optional[dict] = None
    repository: dict
    sender: dict

