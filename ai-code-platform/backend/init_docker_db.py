"""
Simple database initialization script for Docker setup
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskType, TaskPriority, TaskStatus, TaskStage
from app.core.database import Base
from passlib.context import CryptContext

# Use explicit database URL for Docker
DATABASE_URL = "postgresql://aicode:aicode123@localhost:5433/ai_code_platform"

# Create engine
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=4)

def create_tables():
    """Create all tables"""
    print("\n" + "="*50)
    print("Creating Database Tables")
    print("="*50)
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully")

def create_test_data():
    """Create test data"""
    print("\n" + "="*50)
    print("Creating Test Data")
    print("="*50)
    
    db = SessionLocal()
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("✓ Test user already exists")
            user = existing_user
        else:
            # Create test user with simpler password hash
            user = User(
                email="test@example.com",
                name="Test User",
                hashed_password=pwd_context.hash("testpassword123"),
                role=UserRole.DEVELOPER,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("✓ Test user created")
        
        # Check if project exists
        existing_project = db.query(Project).filter(
            Project.owner_id == user.id,
            Project.name == "AI Code Platform Demo"
        ).first()
        
        if existing_project:
            print("✓ Test project already exists")
            project = existing_project
        else:
            # Create test project
            project = Project(
                name="AI Code Platform Demo",
                description="Demo project for testing the AI Code Generation Platform",
                owner_id=user.id,
                jira_project_key="DEMO",
                github_repo_url="https://github.com/demo/ai-code-platform",
                status=ProjectStatus.ACTIVE
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print("✓ Test project created")
        
        # Check if tasks exist
        existing_tasks_count = db.query(Task).filter(Task.project_id == project.id).count()
        
        if existing_tasks_count > 0:
            print(f"✓ {existing_tasks_count} tasks already exist")
        else:
            # Create test tasks
            tasks = [
                Task(
                    project_id=project.id,
                    jira_issue_key="DEMO-1",
                    title="Implement User Authentication API",
                    description="Create REST API endpoints for user registration, login, and token refresh",
                    type=TaskType.FEATURE,
                    status=TaskStatus.COMPLETED,
                    current_stage=TaskStage.DEPLOYED,
                    priority=TaskPriority.HIGH
                ),
                Task(
                    project_id=project.id,
                    jira_issue_key="DEMO-2",
                    title="Build Dashboard UI",
                    description="Create a responsive dashboard with project overview and statistics",
                    type=TaskType.FEATURE,
                    status=TaskStatus.IN_PROGRESS,
                    current_stage=TaskStage.CODE_REVIEW,
                    priority=TaskPriority.MEDIUM
                ),
                Task(
                    project_id=project.id,
                    jira_issue_key="DEMO-3",
                    title="Fix Authentication Bug",
                    description="Token refresh is not working correctly in some edge cases",
                    type=TaskType.BUGFIX,
                    status=TaskStatus.PENDING,
                    current_stage=TaskStage.REQUIREMENT,
                    priority=TaskPriority.CRITICAL
                ),
                Task(
                    project_id=project.id,
                    title="AI Code Review Agent",
                    description="Implement an AI agent that automatically reviews pull requests",
                    type=TaskType.AGENT,
                    status=TaskStatus.PENDING,
                    current_stage=TaskStage.SPEC_GENERATION,
                    priority=TaskPriority.LOW
                ),
            ]
            
            for task in tasks:
                db.add(task)
            
            db.commit()
            print(f"✓ Created {len(tasks)} test tasks")
        
        print("\n" + "="*50)
        print("✓ Database Initialization Complete!")
        print("="*50)
        print("\nLogin Credentials:")
        print("  Email:    test@example.com")
        print("  Password: testpassword123")
        print(f"\nCreated:")
        print(f"  - 1 User")
        print(f"  - 1 Project (AI Code Platform Demo)")
        print(f"  - 4 Tasks with different statuses")
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"\n✗ Error creating test data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    try:
        create_tables()
        create_test_data()
        print("\n✅ SUCCESS! Database is ready.\n")
        print("Next steps:")
        print("1. Start backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8082")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Open browser:   http://localhost:3012\n")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

