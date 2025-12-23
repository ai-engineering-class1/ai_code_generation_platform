from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.activity_log_service import ActivityLogService
from app.schemas.activity import (
    ActivityCreate, 
    ActivityUpdate,
    ActivityAppend,
    ActivityEnd, 
    ActivityTieBackUpdate, 
    ActivityResponse
)

router = APIRouter()
service = ActivityLogService()

@router.post("/start", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def start_activity(
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Start a new activity (Active State).
    """
    return service.start_activity(
        db=db,
        task_id=activity_in.task_id,
        title=activity_in.title,
        operator_id=activity_in.operator_id,
        activity_type=activity_in.activity_type,
        situation=activity_in.situation,
        task_role=activity_in.task_role,
        parent_activity_id=activity_in.parent_activity_id
    )

@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a single activity by ID.
    """
    activity = service.get_activity(db, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    activity_in: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an ongoing activity (Execution Phase).
    Allowed: Action, Metadata.
    """
    try:
        activity = service.update_activity(
            db=db,
            activity_id=activity_id,
            action=activity_in.action,
            metadata=activity_in.metadata
        )
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        return activity
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{activity_id}/append", response_model=ActivityResponse)
async def append_activity_action(
    activity_id: str,
    activity_in: ActivityAppend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Append text to the Action field (Streaming).
    """
    try:
        activity = service.append_activity_action(
            db=db,
            activity_id=activity_id,
            action_chunk=activity_in.action_chunk
        )
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        return activity
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{activity_id}/end", response_model=ActivityResponse)
async def end_activity(
    activity_id: str,
    activity_in: ActivityEnd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    End an activity (Freezes it).
    Required: Result.
    """
    try:
        activity = service.end_activity(
            db=db,
            activity_id=activity_id,
            result=activity_in.result,
            status=activity_in.status,
            tie_back=activity_in.tie_back
        )
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        return activity
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{activity_id}/tie-back", response_model=ActivityResponse)
async def update_tie_back(
    activity_id: str,
    activity_in: ActivityTieBackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update Tie-back for a completed activity (Archived Phase).
    """
    activity = service.update_tie_back(
        db=db,
        activity_id=activity_id,
        tie_back=activity_in.tie_back
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.get("/tasks/{task_id}/current", response_model=Optional[ActivityResponse])
async def get_current_activity(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the single currently active activity for a task (if any).
    Useful for 'Now Processing...' banners.
    """
    return service.get_current_activity(db, task_id)

@router.get("/tasks/{task_id}/history", response_model=List[ActivityResponse])
async def get_activity_log(
    task_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the history log of completed activities.
    """
    return service.get_activity_log(db, task_id, limit)
