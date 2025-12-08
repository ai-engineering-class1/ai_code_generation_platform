#!/usr/bin/env python3
"""
Check if task_workflow_history table exists and verify its schema
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, inspect, text
from app.core.config import settings

def check_table():
    engine = create_engine(settings.DATABASE_URL, echo=False)
    inspector = inspect(engine)
    
    print("Checking task_workflow_history table...")
    print(f"Database URL: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'hidden'}")
    print()
    
    # Check if table exists
    tables = inspector.get_table_names()
    print(f"All tables: {tables}")
    print()
    
    if 'task_workflow_history' in tables:
        print("✅ Table 'task_workflow_history' exists")
        print()
        
        # Get columns
        columns = inspector.get_columns('task_workflow_history')
        print("Columns in task_workflow_history:")
        for col in columns:
            print(f"  - {col['name']}: {col['type']}")
        print()
        
        # Check if metadata column exists
        column_names = [col['name'] for col in columns]
        if 'metadata' in column_names:
            print("✅ Column 'metadata' exists")
        else:
            print("❌ Column 'metadata' does NOT exist")
            print(f"   Available columns: {column_names}")
        
        # Try a simple query
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM task_workflow_history"))
                count = result.scalar()
                print(f"✅ Table is accessible. Row count: {count}")
        except Exception as e:
            print(f"❌ Error querying table: {e}")
    else:
        print("❌ Table 'task_workflow_history' does NOT exist")
        print("   You may need to run database migrations or create the table")
        
        # Try to create it
        print("\nAttempting to create table...")
        try:
            from app.core.database import Base
            from app.models.notification import TaskWorkflowHistory
            Base.metadata.create_all(bind=engine, tables=[TaskWorkflowHistory.__table__])
            print("✅ Table created successfully")
        except Exception as e:
            print(f"❌ Error creating table: {e}")

if __name__ == "__main__":
    check_table()

