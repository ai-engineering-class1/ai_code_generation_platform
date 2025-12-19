"""
Simple database initialization script for Docker setup
Uses direct SQL to avoid model relationship issues
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import bcrypt
import uuid

# Database connection parameters
DB_PARAMS = {
    'host': 'localhost',
    'port': 5433,
    'user': 'aicode',
    'password': 'aicode123',
    'database': 'ai_code_platform'
}

def create_data():
    """Create test data using direct SQL"""
    print("\n" + "="*60)
    print(" PostgreSQL Docker Database Setup")
    print("="*60)
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_PARAMS)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print("\n✓ Connected to PostgreSQL")
        
        # Generate IDs
        user_id = str(uuid.uuid4())
        project_id = str(uuid.uuid4())
        task_ids = [str(uuid.uuid4()) for _ in range(4)]
        
        # Hash password (truncate to 72 bytes for bcrypt)
        password = "testpassword123".encode('utf-8')
        hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", ('test@example.com',))
        existing_user = cur.fetchone()
        
        if existing_user:
            print("✓ Test user already exists")
            user_id = existing_user[0]
        else:
            # Insert test user
            cur.execute("""
                INSERT INTO users (id, email, name, hashed_password, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, 'test@example.com', 'Test User', hashed_password, 'DEVELOPER', True))
            print("✓ Created test user")
        
        # Check if project exists
        cur.execute("SELECT id FROM projects WHERE owner_id = %s AND name = %s", 
                   (user_id, 'AI Code Platform Demo'))
        existing_project = cur.fetchone()
        
        if existing_project:
            print("✓ Test project already exists")
            project_id = existing_project[0]
        else:
            # Insert test project
            cur.execute("""
                INSERT INTO projects (id, name, description, owner_id, jira_project_key, github_repo_url, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                project_id,
                'AI Code Platform Demo',
                'Demo project for testing the AI Code Generation Platform',
                user_id,
                'DEMO',
                'https://github.com/demo/ai-code-platform',
                'ACTIVE'
            ))
            print("✓ Created test project")
        
        # Check if tasks exist
        cur.execute("SELECT COUNT(*) FROM tasks WHERE project_id = %s", (project_id,))
        task_count = cur.fetchone()[0]
        
        if task_count > 0:
            print(f"✓ {task_count} tasks already exist")
        else:
            # Insert test tasks
            tasks_data = [
                (
                    task_ids[0],
                    project_id,
                    'DEMO-1',
                    'Implement User Authentication API',
                    'Create REST API endpoints for user registration, login, and token refresh',
                    'FEATURE',
                    'COMPLETED',
                    'DEPLOYED',
                    'HIGH'
                ),
                (
                    task_ids[1],
                    project_id,
                    'DEMO-2',
                    'Build Dashboard UI',
                    'Create a responsive dashboard with project overview and statistics',
                    'FEATURE',
                    'IN_PROGRESS',
                    'CODE_REVIEW',
                    'MEDIUM'
                ),
                (
                    task_ids[2],
                    project_id,
                    'DEMO-3',
                    'Fix Authentication Bug',
                    'Token refresh is not working correctly in some edge cases',
                    'BUGFIX',
                    'PENDING',
                    'REQUIREMENT',
                    'CRITICAL'
                ),
                (
                    task_ids[3],
                    project_id,
                    None,
                    'AI Code Review Agent',
                    'Implement an AI agent that automatically reviews pull requests',
                    'AGENT',
                    'PENDING',
                    'SPEC_GENERATION',
                    'LOW'
                ),
            ]
            
            for task in tasks_data:
                cur.execute("""
                    INSERT INTO tasks (id, project_id, jira_issue_key, title, description, type, status, current_stage, priority)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, task)
            
            print(f"✓ Created {len(tasks_data)} test tasks")
        
        # Close connection
        cur.close()
        conn.close()
        
        print("\n" + "="*60)
        print(" ✅ Database Initialization Complete!")
        print("="*60)
        print("\n🔑 Login Credentials:")
        print("   Email:    test@example.com")
        print("   Password: testpassword123")
        print(f"\n📦 Created:")
        print(f"   • 1 User")
        print(f"   • 1 Project (AI Code Platform Demo)")
        print(f"   • 4 Tasks with different statuses")
        print("\n" + "="*60)
        print(" 🚀 Next Steps:")
        print("="*60)
        print("\n1. Start Backend:")
        print("   cd backend")
        print("   source venv/bin/activate")
        print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("\n2. Start Frontend:")
        print("   cd frontend")
        print("   npm run dev")
        print("\n3. Open Browser:")
        print("   http://localhost:3012")
        print("\n" + "="*60)
        
    except psycopg2.Error as e:
        print(f"\n❌ Database Error: {e}")
        print(f"\nMake sure:")
        print(f"  • Docker containers are running (docker ps)")
        print(f"  • PostgreSQL is accessible on port 5433")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = create_data()
    exit(0 if success else 1)

