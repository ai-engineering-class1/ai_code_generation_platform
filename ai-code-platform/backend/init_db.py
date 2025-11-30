"""
Database initialization and test data creation script
"""
import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskType, TaskPriority, TaskStatus, TaskStage
from app.models.integration import JiraConfiguration, GitHubConfiguration
import uuid


def create_test_user(db: Session) -> User:
    """Create a test user"""
    print("Creating test user...")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == "test@example.com").first()
    if existing_user:
        print("✓ Test user already exists")
        return existing_user
    
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        role=UserRole.DEVELOPER,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print("✓ Test user created")
    print(f"  Email: test@example.com")
    print(f"  Password: testpassword123")
    return user


def create_test_project(db: Session, user: User) -> Project:
    """Create a test project"""
    print("\nCreating test project...")
    
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
    return project


def create_test_tasks(db: Session, project: Project) -> list[Task]:
    """Create test tasks"""
    print("\nCreating test tasks...")
    
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
    return tasks


def init_db():
    """Initialize database with tables"""
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")


def create_test_data():
    """Create test data for development"""
    print("\n" + "="*50)
    print("Creating Test Data")
    print("="*50)
    
    db = SessionLocal()
    try:
        user = create_test_user(db)
        project = create_test_project(db, user)
        tasks = create_test_tasks(db, project)
        
        print("\n" + "="*50)
        print("✓ Test Data Creation Complete!")
        print("="*50)
        print("\nYou can now login with:")
        print("  Email: test@example.com")
        print("  Password: testpassword123")
        print(f"\nCreated:")
        print(f"  - 1 User")
        print(f"  - 1 Project")
        print(f"  - {len(tasks)} Tasks")
        print("\nAccess the application at: http://localhost:3000")
        
    except Exception as e:
        print(f"\n✗ Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    create_test_data()

