#!/usr/bin/env python3
"""
Test script to check if task endpoint is working
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.task import Task
from app.models.project import Project

def test_task_exists():
    db = SessionLocal()
    try:
        task_id = "1816efb7-e5da-4d51-abd1-9bbce01327d4"
        project_id = "2de6763a-e1f5-4f2e-9251-bda3bf2f0f0d"
        
        print(f"Looking for task: {task_id}")
        print(f"In project: {project_id}")
        
        # Check if project exists
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            print(f"❌ Project {project_id} not found")
            return False
        print(f"✅ Project found: {project.name}")
        
        # Check if task exists
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.project_id == project_id
        ).first()
        
        if not task:
            print(f"❌ Task {task_id} not found in project {project_id}")
            # Check if task exists elsewhere
            task_anywhere = db.query(Task).filter(Task.id == task_id).first()
            if task_anywhere:
                print(f"⚠️  Task exists but in different project: {task_anywhere.project_id}")
            else:
                print(f"❌ Task {task_id} does not exist at all")
            return False
        
        print(f"✅ Task found: {task.title}")
        print(f"   Status: {task.status}")
        print(f"   Type: {task.type}")
        print(f"   Priority: {task.priority}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("TESTING TASK ENDPOINT")
    print("=" * 60)
    test_task_exists()
    print("=" * 60)

