from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    type: str  # info, warning, error, approval_required
    title: str
    message: Optional[str] = None
    action_url: Optional[str] = Field(None, serialization_alias="actionUrl")


class NotificationCreate(NotificationBase):
    user_id: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None


class NotificationResponse(NotificationBase):
    id: str
    user_id: str = Field(..., serialization_alias="userId")
    project_id: Optional[str] = Field(None, serialization_alias="projectId")
    task_id: Optional[str] = Field(None, serialization_alias="taskId")
    read: bool
    created_at: datetime = Field(..., serialization_alias="createdAt")
    severity: int = 1
    event_code: Optional[str] = Field(None, serialization_alias="eventCode")
    email_sent: bool = Field(False, serialization_alias="emailSent")

    model_config = {"from_attributes": True, "populate_by_name": True}


class NotificationMarkRead(BaseModel):
    notification_ids: list[str]

