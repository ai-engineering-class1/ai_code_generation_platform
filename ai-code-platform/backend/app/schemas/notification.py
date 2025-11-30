from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    type: str  # info, warning, error, approval_required
    title: str
    message: Optional[str] = None
    action_url: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None


class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    notification_ids: list[str]

