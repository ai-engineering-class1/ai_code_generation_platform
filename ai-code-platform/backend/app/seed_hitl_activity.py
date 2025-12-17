
import os
import sys
import uuid
from datetime import datetime

# Setup paths first
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.append(backend_dir)
print(f"Added to path: {backend_dir}")

# Load env vars
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

# Now import app modules
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.task import Task, TaskWorkflowHistory, ActivityStatus
from app.core.config import settings

def seed_pending_activity():
    # Setup DB connection
    # Hack: Force sync driver if configured for async
    db_url = settings.DATABASE_URL
    if "asyncpg" in db_url:
        db_url = db_url.replace("+asyncpg", "")
        
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find a task to attach to
        task = db.query(Task).first()
        if not task:
            print("No tasks found. Please create a task first.")
            return

        print(f"Attaching to Task: {task.title} ({task.id})")

        # Create Pending Activity
        activity = TaskWorkflowHistory(
            id=str(uuid.uuid4()),
            task_id=task.id,
            title="Manual Code Review Required",
            operator_id="System-Monitor",
            activity_type="system_alert",
            status=ActivityStatus.PENDING_USER_INPUT.value,
            situation="Automated checks passed, but heuristic analysis suggests complex logic changes.",
            task_role="Safety Monitor",
            activity_start_at=datetime.utcnow(),
            activity_end_at=None, # Active
            workflow_metadata={
                "severity": "medium",
                "requires_approval": True,
                "suggested_actions": ["Review auth logic", "Check potential deadlock"]
            }
        )
        
        db.add(activity)
        db.commit()
        print(f"Created Pending Activity: {activity.id}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_pending_activity()
