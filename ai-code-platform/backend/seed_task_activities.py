import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.task import Task, TaskStatus, TaskPriority, TaskType, TaskStage
from app.models.project import Project
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority, TaskType, TaskStage, TaskWorkflowHistory
from app.core.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        print("Seeding task activity data...")

        # 1. Get or Create User
        email = "test@example.com"
        password = "testpassword123"
        hashed_pw = get_password_hash(password)
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                name="Test User",
                hashed_password=hashed_pw,
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"Created user: {user.email} with password: {password}")
        else:
            # Update password for existing user
            user.hashed_password = hashed_pw
            db.commit()
            print(f"Updated user: {user.email} with password: {password} (ID: {user.id})")

        # 2. Get or Create Project
        project = db.query(Project).filter(Project.name == "Test Project").first()
        if not project:
            project = Project(
                id=str(uuid.uuid4()),
                name="Test Project",
                description="A project for testing tasks",
                owner_id=user.id
            )
            db.add(project)
            db.commit()
            print(f"Created project: {project.name}")
        else:
            print(f"Using project: {project.name} (ID: {project.id})")

        # 3. Create Task
        title = "Implement Task UI Pagination"
        task = db.query(Task).filter(Task.title == title).first()
        
        if not task:
            task = Task(
                id=str(uuid.uuid4()),
                title=title,
                description="Add pagination to the activity log in the task detail page.",
                project_id=project.id,
                assignee_id=user.id,
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.HIGH,
                type=TaskType.FEATURE,
                current_stage=TaskStage.CODE_GENERATION
            )
            db.add(task)
            db.commit()
            print(f"Created task: {task.title} (ID: {task.id})")
        else:
            print(f"Using existing task: {task.title} (ID: {task.id})")

        # 4. Create History
        # Check if history already exists to avoid duplication if run multiple times
        # 4. Create History
        # Clear existing history to allow re-seeding with updated data structure
        existing_history = db.query(TaskWorkflowHistory).filter(TaskWorkflowHistory.task_id == task.id).all()
        for history_item in existing_history:
            db.delete(history_item)
        db.commit()
        print(f"Cleared {len(existing_history)} existing activities.")

        activities = []
        
        # Determine base time
        base_time = datetime.now() - timedelta(days=5)

        titles = [
            "Task Created", "Requirements Gathering", "Spec Logic Draft", "Spec Review",
            "Spec Approved", "Code Generation Started", "Agent Thinking", "Tool Use: Read File",
            "Tool Use: Write File", "Linting Error", "Fixing Lint", "Tests Running",
            "Tests Passed", "PR Created", "Code Review Comment", "Addressing Feedback",
            "Merged to Develop", "Deploying to Staging", "Verification Failed", "Retrying Deployment"
        ]
        
        agent_names = [
            "Code Generation Agent", "Code Review Agent", "Test Runner Agent", 
            "Documentation Agent", "Security Audit Agent", "Deployment Agent"
        ]

        # Add completed activities
        for i, title in enumerate(titles):
            # Create timestamp increasing by hours
            created_at = base_time + timedelta(hours=i*4)
            
            # Decide operator: mostly agents, sometimes user
            if i < 2 or title in ["Spec Review", "Spec Approved", "Code Review Comment"]:
                 # User actions
                operator_id = user.name  # Storing Name directly as requested by user
            else:
                operator_id = random.choice(agent_names)

            # Action/Result variety
            action = f"Action for {title}: {operator_id} performed this step."
            result = f"Result of {title} was successful."
            status = "completed"
            
            if "Error" in title or "Failed" in title:
                result = f"Result of {title} failed."
                status = "failed"
            
            history = TaskWorkflowHistory(
                id=str(uuid.uuid4()),
                task_id=task.id,
                title=title,
                operator_id=operator_id,
                action=action,
                result=result,
                situation=f"Situation for {title}: {random.choice(['Normal process', 'Critical path', 'Retrying'])}",
                task_role=f"Role: Execute {title}",
                tie_back=random.choice([
                    "This step ensures compliance with the project's quality gates.",
                    "Optimizing for latency in this phase reduced overall build time by 15%.",
                    "By caching these results, we avoid redundant computations.",
                    "This interaction highlights the need for clearer spec definitions.",
                    None
                ]),
                status=status,
                created_at=created_at,
                activity_end_at=created_at + timedelta(minutes=5)
            )
            activities.append(history)
            
        # Add ONE Active Activity (In Progress)
        active_history = TaskWorkflowHistory(
            id=str(uuid.uuid4()),
            task_id=task.id,
            title="Running Integration Tests",
            operator_id="Test Runner Agent",
            action="Running suite of 150 integration tests...",
            result="Pending...",
            situation="Verification phase",
            status="in_progress",
            created_at=datetime.now(),
            activity_end_at=None # Still running
        )
        activities.append(active_history)

        db.add_all(activities)
        db.commit()
        print(f"Added {len(activities)} activity history records (including 1 active).")
        
        print("Done!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
