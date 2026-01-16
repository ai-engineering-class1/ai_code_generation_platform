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
        # Check if is_robot column exists in users
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='is_robot'
            """))
            if result.fetchone() is None:
                print("Adding is_robot column to users table...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_robot BOOLEAN NOT NULL DEFAULT FALSE
                """))
                conn.commit()
                print("✓ is_robot column added")
            else:
                print("✓ is_robot column already exists")
        except Exception as e:
            print(f"Error checking/adding is_robot: {e}")

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

        # Check / add new GitHub configuration auth columns
        try:
            print("\nChecking new columns for github_configurations...")
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='github_configurations'
            """))
            existing_columns = [row[0] for row in result.fetchall()]

            github_new_columns = {
                'auth_method': "VARCHAR(20) NOT NULL DEFAULT 'token'",
                'github_app_id': 'VARCHAR(50)',
                'github_app_installation_id': 'VARCHAR(50)',
                'github_app_private_key': 'TEXT',
            }

            for col_name, col_type in github_new_columns.items():
                if col_name not in existing_columns:
                    print(f"Adding column {col_name} to github_configurations...")
                    conn.execute(text(f"""
                        ALTER TABLE github_configurations
                        ADD COLUMN {col_name} {col_type}
                    """))
                    print(f"✓ {col_name} added")
                else:
                    print(f"✓ {col_name} already exists")

            conn.commit()
        except Exception as e:
            print(f"Error checking/updating github_configurations: {e}")

        # Add new columns for TaskWorkflowHistory
        new_columns = {
            'operator_id': 'VARCHAR',
            'activity_start_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            'activity_end_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NULL',
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
            
            # 1. Drop old activity_end_at index if exists (replaced by composite)
            try:
                conn.execute(text("""
                    DROP INDEX IF EXISTS ix_task_workflow_history_activity_end_at
                """))
                print("✓ Old index ix_task_workflow_history_activity_end_at dropped (if existed)")
            except Exception as e:
                print(f"Error dropping old index: {e}")

            # 2. Create new Composite Indices
            # ix_task_hist_task_start
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_task_hist_task_start 
                    ON task_workflow_history (task_id, activity_start_at DESC)
                """))
                print("✓ ix_task_hist_task_start ensured")
            except Exception as e:
                print(f"Error creating index ix_task_hist_task_start: {e}")

            # ix_task_hist_task_end
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_task_hist_task_end 
                    ON task_workflow_history (task_id, activity_end_at DESC)
                """))
                print("✓ ix_task_hist_task_end ensured")
            except Exception as e:
                print(f"Error creating index ix_task_hist_task_end: {e}")

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


        try:
            print("\nEnsuring activity_end_at has no default value (fix for freezing bug)...")
            conn.execute(text("ALTER TABLE task_workflow_history ALTER COLUMN activity_end_at DROP DEFAULT"))
            # Also drop NOT NULL if it exists, to allow active activities
            try:
                 conn.execute(text("ALTER TABLE task_workflow_history ALTER COLUMN activity_end_at DROP NOT NULL"))
            except Exception:
                 pass
            conn.commit()
            print("✓ activity_end_at default dropped")
        except Exception as e:
            # It might fail if default didn't exist, which is fine
            print(f"Note: Could not drop default (might not exist): {e}")

        # --- RBAC & Organization Migration ---
        try:
            print("\nUpdating RBAC & Organization Schema...")
            # Import new models to ensure they are registered with Base.metadata
            from app.models import rbac, organization, subscription
            
            # Create new tables if they don't exist
            Base.metadata.create_all(bind=engine)
            print("✓ New tables (permissions, roles, organizations, etc.) ensured")
            

            # Seed Initial Roles & Permissions
            # Check if "Manager" exists (using new standard roles)
            result = conn.execute(text("SELECT id FROM roles WHERE name='Manager'"))
            if not result.fetchone():
                print("Seeding standard roles (Manager, Developer, QA_Tester, Author)...")
                import uuid
                
                # Helper to create/get role
                # We do this with raw SQL blocks for migration simplicity
                
                roles_data = {
                    "Manager": "Project administrator and team lead",
                    "Developer": "Technical contributor implementing features",
                    "QA_Tester": "Quality assurance specialist",
                    "Author": "Content/Requirement creator",
                    "System Admin": "Full system access"
                }
                
                role_ids = {}
                for r_name, r_desc in roles_data.items():
                    # Check if exists
                    existing = conn.execute(text(f"SELECT id FROM roles WHERE name='{r_name}'")).fetchone()
                    if existing:
                        role_ids[r_name] = existing[0]
                    else:
                        rid = str(uuid.uuid4())
                        is_sys = 'TRUE' if r_name == 'System Admin' else 'FALSE'
                        conn.execute(text(f"INSERT INTO roles (id, name, description, is_system_role) VALUES ('{rid}', '{r_name}', '{r_desc}', {is_sys})"))
                        role_ids[r_name] = rid
                
                # Define Permissions (Code, Name, Type)
                # Derived from RBAC_Design.md
                perms_data = [
                    # Project Management
                    ("proj:create", "Create Project", "button"),
                    ("proj:delete", "Delete Project", "button"),
                    ("proj:settings", "Update Settings", "menu"),
                    ("proj:members", "Manage Members", "menu"),
                    
                    # Task Management
                    ("task:create", "Create Task", "button"),
                    ("task:edit", "Edit Task Details", "button"),
                    ("task:delete", "Delete Task", "button"),
                    ("task:assign", "Assign Task", "button"),
                    
                    # Spec
                    ("spec:edit", "Edit Specification", "button"),
                    ("spec:approve", "Approve Specification", "button"),
                    
                    # Execution
                    ("exec:codegen", "Trigger Code Gen", "button"),
                    ("exec:terminal", "Open Terminal", "menu"),
                    ("exec:source", "View Source Code", "menu"),
                    
                    # Workflow
                    ("wf:progress", "Mark In Progress", "button"),
                    ("wf:qa", "Mark Ready for QA", "button"),
                    ("wf:complete", "Mark Completed", "button"),
                    ("wf:fail", "Mark Failed", "button"),

                    # System
                    ("sys:admin", "System Administration", "menu")
                ]
                
                perm_ids = {}
                for p_code, p_name, p_type in perms_data:
                    existing = conn.execute(text(f"SELECT id FROM permissions WHERE code='{p_code}'")).fetchone()
                    if existing:
                        perm_ids[p_code] = existing[0]
                    else:
                        pid = str(uuid.uuid4())
                        conn.execute(text(f"INSERT INTO permissions (id, code, name, type) VALUES ('{pid}', '{p_code}', '{p_name}', '{p_type}')"))
                        perm_ids[p_code] = pid

                # Matrix Assignments (Role -> [Permissions])
                # Manager: Everything except QA pass/fail specific flows? 
                # Based on matrix:
                matrix = {
                    "Manager": ["proj:create", "proj:delete", "proj:settings", "proj:members", 
                                "task:create", "task:edit", "task:delete", "task:assign",
                                "spec:edit", "spec:approve",
                                "exec:codegen", "exec:terminal", "exec:source",
                                "wf:progress", "wf:qa", "wf:complete", "wf:fail"],
                                
                    "Developer": ["task:create", "task:edit", "task:assign",
                                  "spec:edit",
                                  "exec:codegen", "exec:terminal", "exec:source",
                                  "wf:progress", "wf:qa", "wf:fail"],
                                  
                    "QA_Tester": ["exec:source", "wf:complete", "wf:fail"], # Matrix says QA can View Source
                    
                    "Author": ["proj:create", 
                               "task:create", "task:edit", "task:delete", "task:assign",
                               "spec:edit", "spec:approve", "exec:source"],
                    
                    "System Admin": [p[0] for p in perms_data] # All permissions
                }
                
                for r_name, p_codes in matrix.items():
                    rid = role_ids[r_name]
                    for p_code in p_codes:
                        if p_code in perm_ids:
                            pid = perm_ids[p_code]
                            # Check link
                            link = conn.execute(text(f"SELECT role_id FROM role_permissions WHERE role_id='{rid}' AND permission_id='{pid}'")).fetchone()
                            if not link:
                                conn.execute(text(f"INSERT INTO role_permissions (role_id, permission_id) VALUES ('{rid}', '{pid}')"))

                conn.commit()
                print("✓ Extended RBAC roles and matrix seeded")
            else:
                print("✓ RBAC roles already seeded (checked Manager)")
                
        except Exception as e:
            print(f"Error updating RBAC schema: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    update_schema()

