"""
Script to update database schema - adds missing columns to existing tables
"""
from app.core.database import Base, engine
from sqlalchemy import text
from app.models import user, project, task, integration, workflow, notification

def update_schema():
    """Add missing columns to existing tables"""
    print("Updating database schema...")
    
    with engine.connect() as conn:
        # Check if jira_email column exists in jira_configurations
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='jira_configurations' AND column_name='jira_email'
            """))
            if result.fetchone() is None:
                print("Adding jira_email column to jira_configurations table...")
                conn.execute(text("""
                    ALTER TABLE jira_configurations 
                    ADD COLUMN jira_email VARCHAR(255) NOT NULL DEFAULT ''
                """))
                conn.commit()
                print("✓ jira_email column added")
            else:
                print("✓ jira_email column already exists")
        except Exception as e:
            print(f"Error checking/adding jira_email: {e}")
            # If table doesn't exist, create all tables
            print("Creating all tables...")
            Base.metadata.create_all(bind=engine)
            print("✓ All tables created")
            return
        
        # Check if workflow_metadata column exists (renamed from metadata)
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='task_workflow_history' AND column_name='workflow_metadata'
            """))
            if result.fetchone() is None:
                # Check if metadata column exists
                result2 = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='task_workflow_history' AND column_name='metadata'
                """))
                if result2.fetchone():
                    print("Renaming metadata to workflow_metadata in task_workflow_history...")
                    conn.execute(text("""
                        ALTER TABLE task_workflow_history 
                        RENAME COLUMN metadata TO workflow_metadata
                    """))
                    conn.commit()
                    print("✓ Column renamed")
                else:
                    print("Adding workflow_metadata column to task_workflow_history table...")
                    conn.execute(text("""
                        ALTER TABLE task_workflow_history 
                        ADD COLUMN workflow_metadata JSON
                    """))
                    conn.commit()
                    print("✓ workflow_metadata column added")
            else:
                print("✓ workflow_metadata column already exists")
        except Exception as e:
            print(f"Error checking/updating workflow_metadata: {e}")
    
    print("\n✓ Database schema update complete!")

if __name__ == "__main__":
    update_schema()

