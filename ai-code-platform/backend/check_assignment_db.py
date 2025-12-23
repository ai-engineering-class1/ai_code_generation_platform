
import sys
import os

# Set up paths to include backend
sys.path.append(os.path.join(os.getcwd(), 'app'))
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.task import Task
from app.models.user import User
from app.core.database import SessionLocal

# CONSTANTS
PROJECT_ID = "893c4654-b502-4559-8aa3-b5be7d6676a9"
TASK_ID = "9f653bf4-cad9-47be-b9d6-cdce66dcd814"

def verify_db_state():
    db = SessionLocal()
    try:
        print(f"Checking Task {TASK_ID}...")
        task = db.query(Task).filter(Task.id == TASK_ID).first()
        
        if not task:
            print("Task not found in DB!")
            return
            
        print(f"Current Assignee ID in DB: {task.assignee_id}")
        if task.assignee:
            print(f"Assignee Name: {task.assignee.name}")
        else:
            print("Assignee Object: None")
            
        # Get a user to assign (any user)
        user = db.query(User).first()
        if not user:
            print("No users found in DB.")
            return
            
        print(f"Found User to assign: {user.id} ({user.email})")
        
        if task.assignee_id == user.id:
            print("Task already assigned to this user. Unassigning first to test change.")
            task.assignee_id = None
            db.commit()
            db.refresh(task)
            print("Unassigned. DB state:", task.assignee_id)
            
        # Now try to update it directly via ORM to see if it works at DB layer
        print("Attempting ORM update to set assignee...")
        task.assignee_id = user.id
        db.commit()
        db.refresh(task)
        
        print(f"ORM Update Result: {task.assignee_id}")
        
        if task.assignee_id == user.id:
            print("ORM Update SUCCESS. DB layer is fine.")
        else:
            print("ORM Update FAILED.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_db_state()
