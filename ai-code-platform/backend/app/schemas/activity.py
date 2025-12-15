from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from app.models.task import ActivityStatus

class ActivityBase(BaseModel):
    title: str
    activity_type: str
    status: Optional[str] = ActivityStatus.IN_PROGRESS.value
    # STAR fields
    situation: Optional[str] = None
    task_role: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    tie_back: Optional[str] = None
    workflow_metadata: Optional[Dict[str, Any]] = None

class ActivityCreate(BaseModel):
    task_id: str
    title: str
    operator_id: str
    activity_type: str
    situation: Optional[str] = None
    task_role: Optional[str] = None
    parent_activity_id: Optional[str] = None

class ActivityUpdate(BaseModel):
    action: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ActivityEnd(BaseModel):
    result: str
    status: ActivityStatus = ActivityStatus.COMPLETED
    tie_back: Optional[str] = None

class ActivityTieBackUpdate(BaseModel):
    tie_back: str

class ActivityResponse(ActivityBase):
    id: str
    task_id: str
    operator_id: str
    activity_start_at: datetime
    activity_end_at: Optional[datetime] = None

    class Config:
        orm_mode = True
