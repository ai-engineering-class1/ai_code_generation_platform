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

        # Add new columns for TaskWorkflowHistory
        new_columns = {
            'operator_id': 'VARCHAR',
            'activity_start_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            'activity_end_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            'situation': 'TEXT',
            'task_role': 'TEXT',
            'action': 'TEXT',
            'result': 'TEXT',
            'tie_back': 'TEXT',
            'activity_type': 'VARCHAR(50)',
            'is_public': 'BOOLEAN DEFAULT TRUE',
            'updated_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            'search_vector': 'TSVECTOR',
            'title': 'VARCHAR(255)'
        }

        try:
            print("\nChecking new columns for task_workflow_history...")
            # Get existing columns
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='task_workflow_history'
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            
            for col_name, col_type in new_columns.items():
                if col_name not in existing_columns:
                    print(f"Adding column {col_name}...")
                    conn.execute(text(f"""
                        ALTER TABLE task_workflow_history 
                        ADD COLUMN {col_name} {col_type}
                    """))
                    print(f"✓ {col_name} added")
                else:
                    print(f"✓ {col_name} already exists")
            
            conn.commit()
            
            # Create Indices
            print("\nChecking indices...")
            # activity_end_at index
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_task_workflow_history_activity_end_at 
                    ON task_workflow_history (activity_end_at)
                """))
                print("✓ ix_task_workflow_history_activity_end_at ensured")
            except Exception as e:
                print(f"Error creating index on activity_end_at: {e}")

            # GIN index for search_vector
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_task_workflow_history_search_vector 
                    ON task_workflow_history USING GIN (search_vector)
                """))
                print("✓ ix_task_workflow_history_search_vector ensured")
            except Exception as e:
                print(f"Error creating GIN index: {e}")

            # Create Trigger for auto-updating search_vector
            # We use a helper function to coalesce nulls to empty strings
            print("\nSetting up Full Text Search trigger...")
            trigger_func_sql = """
            CREATE OR REPLACE FUNCTION task_workflow_history_search_vector_update() RETURNS trigger AS $$
            BEGIN
                NEW.search_vector :=
                    setweight(to_tsvector('english', COALESCE(NEW.situation, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(NEW.task_role, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(NEW.action, '')), 'C') ||
                    setweight(to_tsvector('english', COALESCE(NEW.result, '')), 'D');
                RETURN NEW;
            END
            $$ LANGUAGE plpgsql;
            """
            conn.execute(text(trigger_func_sql))
            
            trigger_sql = """
            DROP TRIGGER IF EXISTS tsvectorupdate ON task_workflow_history;
            CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
            ON task_workflow_history FOR EACH ROW EXECUTE FUNCTION task_workflow_history_search_vector_update();
            """
            conn.execute(text(trigger_sql))
            conn.commit()
            print("✓ Full Text Search trigger configured")

        except Exception as e:
            print(f"Error updating task_workflow_history: {e}")


if __name__ == "__main__":
    update_schema()

