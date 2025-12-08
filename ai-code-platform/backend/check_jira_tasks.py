#!/usr/bin/env python3
"""
Quick diagnostic script to check Jira tasks and configuration
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import all models to ensure relationships are properly configured
from app.models import user, project, task, integration, workflow, notification

from app.core.database import SessionLocal
from app.models.task import Task
from app.models.integration import JiraConfiguration
from app.models.project import Project

def main():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("JIRA INTEGRATION DIAGNOSTIC")
        print("=" * 60)
        
        # Check Jira configurations
        print("\n📋 Jira Configurations:")
        configs = db.query(JiraConfiguration).all()
        if not configs:
            print("   ❌ No Jira configurations found")
        else:
            for c in configs:
                project = db.query(Project).filter(Project.id == c.project_id).first()
                project_name = project.name if project else "Unknown"
                print(f"   ✅ Config ID: {c.id}")
                print(f"      - Project ID: {c.project_id}")
                print(f"      - Project Name: {project_name}")
                print(f"      - Jira Project Key: {c.jira_project_key}")
                print(f"      - Jira URL: {c.jira_url}")
                print(f"      - Sync Enabled: {c.sync_enabled}")
                print()
        
        # Check all tasks
        print("\n📋 All Tasks:")
        tasks = db.query(Task).all()
        if not tasks:
            print("   ❌ No tasks found in database")
        else:
            print(f"   ✅ Total tasks: {len(tasks)}")
            print()
            
            # Tasks with Jira keys
            jira_tasks = [t for t in tasks if t.jira_issue_key]
            print(f"   📌 Tasks with Jira keys: {len(jira_tasks)}")
            for t in jira_tasks:
                project = db.query(Project).filter(Project.id == t.project_id).first()
                project_name = project.name if project else "Unknown"
                print(f"      - Task ID: {t.id}")
                print(f"        Jira Key: {t.jira_issue_key}")
                print(f"        Title: {t.title[:60]}")
                print(f"        Project: {project_name} ({t.project_id})")
                print(f"        Status: {t.status}")
                print()
            
            # Tasks without Jira keys
            non_jira_tasks = [t for t in tasks if not t.jira_issue_key]
            if non_jira_tasks:
                print(f"   📌 Tasks without Jira keys: {len(non_jira_tasks)}")
                for t in non_jira_tasks[:5]:  # Show first 5
                    project = db.query(Project).filter(Project.id == t.project_id).first()
                    project_name = project.name if project else "Unknown"
                    print(f"      - Task ID: {t.id}")
                    print(f"        Title: {t.title[:60]}")
                    print(f"        Project: {project_name} ({t.project_id})")
                if len(non_jira_tasks) > 5:
                    print(f"      ... and {len(non_jira_tasks) - 5} more")
                print()
        
        # Check for specific project
        if len(sys.argv) > 1:
            project_id = sys.argv[1]
            print(f"\n📋 Tasks for Project ID: {project_id}")
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                print(f"   Project Name: {project.name}")
                project_tasks = db.query(Task).filter(Task.project_id == project_id).all()
                print(f"   Total tasks: {len(project_tasks)}")
                for t in project_tasks:
                    jira_info = f" (Jira: {t.jira_issue_key})" if t.jira_issue_key else ""
                    print(f"      - {t.title[:50]}{jira_info}")
            else:
                print(f"   ❌ Project not found")
        
        print("\n" + "=" * 60)
        print("DIAGNOSTIC COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

