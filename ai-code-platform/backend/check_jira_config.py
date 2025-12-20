#!/usr/bin/env python3
"""
Check Jira Configuration in Database
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import SessionLocal
    from app.models.integration import JiraConfiguration
    from app.models.task import Task
    from app.models.project import Project
    
    def main():
        print("=" * 60)
        print("🔍 CHECKING JIRA CONFIGURATION")
        print("=" * 60)
        print()
        
        db = SessionLocal()
        try:
            # Check all Jira configurations
            configs = db.query(JiraConfiguration).all()
            
            if not configs:
                print("❌ No Jira configurations found in database!")
                print()
                print("⚠️  ACTION REQUIRED:")
                print("   1. Go to your project settings in the frontend")
                print("   2. Configure Jira integration")
                print("   3. Set jira_project_key to 'CAP' (for CAP-48)")
                print("   4. Make sure the configuration is saved")
                return
            
            print(f"✅ Found {len(configs)} Jira configuration(s):\n")
            
            for config in configs:
                print(f"   📋 Configuration ID: {config.id}")
                print(f"   📁 Project ID: {config.project_id}")
                print(f"   🔑 Jira Project Key: {config.jira_project_key}")
                print(f"   🌐 Jira URL: {config.jira_url}")
                print(f"   📧 Jira Email: {config.jira_email}")
                print(f"   🔄 Sync Enabled: {config.sync_enabled}")
                
                # Check if project exists
                project = db.query(Project).filter(Project.id == config.project_id).first()
                if project:
                    print(f"   ✅ Project exists: {project.name}")
                else:
                    print(f"   ⚠️  Project not found (ID: {config.project_id})")
                
                print()
            
            # Check specifically for CAP project key
            print("=" * 60)
            print("🔍 CHECKING FOR 'CAP' PROJECT KEY")
            print("=" * 60)
            print()
            
            cap_config = db.query(JiraConfiguration).filter(
                JiraConfiguration.jira_project_key == "CAP"
            ).first()
            
            if cap_config:
                print("✅ Found configuration for project key 'CAP'")
                print(f"   📁 Linked to Project ID: {cap_config.project_id}")
                print(f"   🌐 Jira URL: {cap_config.jira_url}")
                print()
                
                # Check if CAP-48 task exists
                cap48_task = db.query(Task).filter(Task.jira_issue_key == "CAP-48").first()
                if cap48_task:
                    print("✅ Task already exists for CAP-48:")
                    print(f"   Task ID: {cap48_task.id}")
                    print(f"   Title: {cap48_task.title}")
                    print(f"   Project ID: {cap48_task.project_id}")
                    print(f"   Status: {cap48_task.status}")
                else:
                    print("❌ No task found for CAP-48")
                    print("   This means the webhook was not received or processed")
                    print()
                    print("   Possible reasons:")
                    print("   1. Webhook not configured in Jira")
                    print("   2. Webhook URL in Jira doesn't match ngrok URL")
                    print("   3. Webhook is disabled in Jira")
                    print("   4. Jira didn't send the webhook event")
            else:
                print("❌ No configuration found for project key 'CAP'")
                print()
                print("⚠️  TO RECEIVE WEBHOOKS FOR CAP-48:")
                print("   1. You need a JiraConfiguration with jira_project_key = 'CAP'")
                print("   2. This should match the prefix of your Jira issue keys")
                print("   3. Configure it in your project settings")
                print()
                print("   Available configurations:")
                for config in configs:
                    print(f"   - Project Key: '{config.jira_project_key}' (Project ID: {config.project_id})")
            
            # Count tasks with Jira keys
            print()
            print("=" * 60)
            print("📊 TASKS WITH JIRA KEYS")
            print("=" * 60)
            print()
            
            jira_tasks = db.query(Task).filter(Task.jira_issue_key.isnot(None)).all()
            print(f"Total tasks with Jira keys: {len(jira_tasks)}")
            
            if jira_tasks:
                print("\n   Recent Jira tasks:")
                for task in jira_tasks[:10]:
                    print(f"   - {task.jira_issue_key}: {task.title[:60]}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    
    if __name__ == "__main__":
        main()
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print()
    print("Make sure you're running this from the backend directory")
    print("and that all dependencies are installed:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

