from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.task import TaskWorkflowHistory, Task, TaskStatus, ActivityStatus

class ActivityLogService:
    """
    Service for managing Activity Logs.
    
    Concepts:
    - Active Activity: An activity currently in progress (end_at is None).
    - Activity Log: A completed activity (end_at is set).
    """

    def start_activity(
        self,
        db: Session,
        task_id: str,
        title: str,
        operator_id: str,
        activity_type: str,
        situation: str = None,
        task_role: str = None,
        parent_activity_id: str = None
    ) -> TaskWorkflowHistory:
        """
        Creates an ACTIVE activity.
        
        Args:
            db: Database session
            task_id: ID of the task
            title: Title of the activity (e.g., "Code Review", "Running Tests")
            operator_id: ID/Name of the agent or user performing the activity
            activity_type: Type of activity (e.g., "agent_action", "system_event")
            situation: STAR framework - Situation context
            task_role: STAR framework - Task role description
            parent_activity_id: Optional ID of a parent activity
            
        Returns:
            The created TaskWorkflowHistory record (Active)
        """
        # Close any existing active activities for this operator/type if needed
        # For now, we allow multiple concurrent active activities (e.g. different agents)
        
        new_activity = TaskWorkflowHistory(
            id=str(uuid.uuid4()),
            task_id=task_id,
            title=title,
            operator_id=operator_id,
            activity_type=activity_type,
            status=ActivityStatus.IN_PROGRESS.value,
            situation=situation,
            task_role=task_role,
            activity_start_at=datetime.utcnow(),
            activity_end_at=None, # Explicitly None to mark as Active
            workflow_metadata={"parent_activity_id": parent_activity_id} if parent_activity_id else {}
        )
        
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        return new_activity

    def update_activity(
        self,
        db: Session,
        activity_id: str,
        action: str = None,
        metadata: Dict[str, Any] = None
    ) -> Optional[TaskWorkflowHistory]:
        """
        Updates an ongoing activity with new details without closing it.
        Useful for streaming thoughts or intermediate steps.
        
        Enforces STAR Framework: Cannot update 'Action' if 'Result' is already populated (Activity Ended).
        """
        activity = db.query(TaskWorkflowHistory).filter(TaskWorkflowHistory.id == activity_id).with_for_update().first()
        if not activity:
            return None
            
        # STAR Framework Rule: Once Result is populated (End Date set), previous stages are frozen.
        if activity.activity_end_at is not None:
            # Exception: Tie-back is mutable even if frozen
            # But this method (update_activity) is generally for execution phase Action/Situation updates.
            # If the user is calling this on a frozen activity, they technically CANNOT update Action/Situation.
            # We must check what they are trying to update.
            
            if action:
                 raise ValueError(f"Cannot update Action for frozen Activity {activity_id}.")
            
            # If it's just metadata (tie-back updates might come via a different path or logic, 
            # here we assume metadata usually implies active context).
            # If the user wants to update tie_back, they should generally use a specific method or we allow strictly tie_back metadata.
            # For simplicity of this service method, we'll block action/metadata on frozen unless explicit.
            # Let's stick to the simpler rule: No updates to action/metadata once frozen. (Tie-back is separate field).
            
            if metadata:
                 raise ValueError(f"Cannot update Metadata/Situation for frozen Activity {activity_id}.")

        if action:
            # Append or replace action? Usually we might want to append for logs, 
            # but for a simple field, let's update it.
            activity.action = action
            
        if metadata:
            current_meta = activity.workflow_metadata or {}
            current_meta.update(metadata)
            activity.workflow_metadata = current_meta
            
        db.commit()
        db.refresh(activity)
        return activity

    def append_activity_action(
        self,
        db: Session,
        activity_id: str,
        action_chunk: str
    ) -> Optional[TaskWorkflowHistory]:
        """
        Appends text to the 'Action' field.
        Useful for true streaming (e.g., token-by-token or line-by-line updates).
        """
        activity = db.query(TaskWorkflowHistory).filter(TaskWorkflowHistory.id == activity_id).with_for_update().first()
        if not activity:
            return None
            
        if activity.activity_end_at is not None:
             raise ValueError(f"Cannot append to Action for frozen Activity {activity_id}.")
        
        current_action = activity.action or ""
        # Append with newline if not empty? Or raw append?
        # Usually for log streaming, raw append or space separated is better.
        # But 'Action' is usually a description. Let's assume raw append gives most control.
        # User can send "\nNew line" if they want.
        activity.action = current_action + action_chunk
        
        db.commit()
        db.refresh(activity)
        return activity

    def update_tie_back(
        self,
        db: Session,
        activity_id: str,
        tie_back: str
    ) -> Optional[TaskWorkflowHistory]:
        """
        Updates the Tie-back field.
        Allowed even if activity is frozen (Result populated).
        """
        activity = db.query(TaskWorkflowHistory).filter(TaskWorkflowHistory.id == activity_id).with_for_update().first()
        if not activity:
            return None
            
        activity.tie_back = tie_back
        db.commit()
        db.refresh(activity)
        return activity

    def end_activity(
        self,
        db: Session,
        activity_id: str,
        result: str,
        status: ActivityStatus = ActivityStatus.COMPLETED,
        tie_back: str = None
    ) -> Optional[TaskWorkflowHistory]:
        """
        Moves activity from ACTIVE to LOG (History).
        Sets the end time and final status.
        
        Enforces STAR Framework: Cannot update 'Result' if activity is already frozen (previously ended).
        """
        activity = db.query(TaskWorkflowHistory).filter(TaskWorkflowHistory.id == activity_id).with_for_update().first()
        if not activity:
            return None
            
        # STAR Framework Rule: Once ended, the Result is immutable.
        if activity.activity_end_at is not None:
             raise ValueError(f"Cannot end Activity {activity_id}: It is already completed/frozen.")
            
        activity.result = result
        # Handle Enum or String input
        if isinstance(status, ActivityStatus):
             activity.status = status.value
        else:
             activity.status = status
             
        activity.tie_back = tie_back
        activity.activity_end_at = datetime.utcnow() # Mark as completed
        
        db.commit()
        db.refresh(activity)
        return activity

    def get_current_activity(self, db: Session, task_id: str) -> Optional[TaskWorkflowHistory]:
        """
        Helper to find the most recent currently running activity for a task.
        """
        return db.query(TaskWorkflowHistory).filter(
            TaskWorkflowHistory.task_id == task_id,
            TaskWorkflowHistory.activity_end_at.is_(None)
        ).order_by(desc(TaskWorkflowHistory.activity_start_at)).first()

    def get_activity_log(self, db: Session, task_id: str, limit: int = 50) -> list[TaskWorkflowHistory]:
        """
        Get the history of completed activities (The Log).
        """
        return db.query(TaskWorkflowHistory).filter(
            TaskWorkflowHistory.task_id == task_id,
            TaskWorkflowHistory.activity_end_at.isnot(None)
        ).order_by(desc(TaskWorkflowHistory.activity_end_at)).limit(limit).all()

    def get_latest_activity_info(self, db: Session, task_id: str) -> Dict[str, Any]:
        """
        Get status and task_role from the latest activity for a task.
        Sorts by activity_start_at DESC.
        """
        latest_activity = db.query(TaskWorkflowHistory).filter(
            TaskWorkflowHistory.task_id == task_id
        ).order_by(desc(TaskWorkflowHistory.activity_start_at)).first()

        if latest_activity:
            return {
                "status": latest_activity.status,
                "task_role": latest_activity.task_role
            }
        
        return {
            "status": None,
            "task_role": None
        }
