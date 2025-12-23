
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'app'))

# Iterate up to backend root
sys.path.append(os.getcwd())

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.project import Project
from app.api.v1.endpoints.tasks import update_task
from app.schemas.task import TaskUpdate
from app.core.config import settings
from app.db.session import SessionLocal

# Mock dependencies
class MockUser:
    def __init__(self, id):
        self.id = id

def test_assignment_logic():
    db = SessionLocal()
    try:
        # 1. Find a project and user to test with
        project = db.query(Project).first()
        user = db.query(User).first()
        
        if not project or not user:
            print("Error: No project or user found in DB to test with.")
            return

        print(f"Using Project: {project.id}, User: {user.id}")

        # 2. Create a dummy task
        task = Task(
            title="Debug Task",
            project_id=project.id,
            status=TaskStatus.PENDING,
            type="feature",
            priority="medium"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        print(f"Created Task: {task.id} with status {task.status} and assignee {task.assignee_id}")

        # 3. Simulate Update - Assign the user
        print("--- Simulating Update Task (Assigning User) ---")
        
        # Manually mimic the logic inside update_task since calling the endpoint directly requires complex dependency injection
        # Copy-paste logic from tasks.py for testing
        
        task_id = task.id
        assignee_id = user.id
        current_user = user # Mock current user as the assignee themselves (or someone else)
        
        # LOGIC FROM update_task
        task = db.query(Task).filter(Task.id == task_id).first()
        old_assignee_id = task.assignee_id
        
        # Simulate TaskUpdate payload
        task_data = TaskUpdate(assignee_id=assignee_id)
        
        # Update fields
        for field, value in task_data.dict(exclude_unset=True).items():
            setattr(task, field, value)
            
        db.commit()
        db.refresh(task)
        
        print(f"Task updated. New assignee: {task.assignee_id}")
        
        # CHECK BUG: Is activity created?
        # Logic block:
        if old_assignee_id != task.assignee_id and task.assignee_id:
            print("Assertion passed: Assignee changed.")
            # Verify ActivityLogService call would happen here...
            
            # Let's verify if the code in tasks.py actually runs.
            # I suspect the issue might be `task_data.dict(exclude_unset=True)` behavior or Pydantic version?
            
            data_dict = task_data.dict(exclude_unset=True)
            print(f"Data to update: {data_dict}")
            
            if 'assignee_id' not in data_dict:
                print("BUG FOUND: assignee_id is MISSING from update dict!")
            else:
                 print("assignee_id is present in update dict.")

            # Let's check the rest of the logic
            # activity_service.start_activity(...) 
            # This requires the ActivityLogService to work.
            
    finally:
        # Cleanup
        if 'task' in locals():
            db.delete(task)
            db.commit()
        db.close()

if __name__ == "__main__":
    test_assignment_logic()
