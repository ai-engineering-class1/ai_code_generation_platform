#!/usr/bin/env python3
"""
Simple test script to check webhook endpoint and database
Uses raw SQL to avoid SQLAlchemy relationship issues
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
import sqlalchemy

def main():
    print("=" * 60)
    print("JIRA WEBHOOK DIAGNOSTIC (Simple Version)")
    print("=" * 60)
    
    with engine.connect() as conn:
        # Check Jira configurations
        print("\n📋 Jira Configurations:")
        result = conn.execute(sqlalchemy.text("""
            SELECT id, project_id, jira_project_key, jira_url, sync_enabled 
            FROM jira_configurations
        """))
        configs = result.fetchall()
        if not configs:
            print("   ❌ No Jira configurations found")
        else:
            for row in configs:
                print(f"   ✅ Config ID: {row[0]}")
                print(f"      - Project ID: {row[1]}")
                print(f"      - Jira Project Key: {row[2]}")
                print(f"      - Jira URL: {row[3]}")
                print(f"      - Sync Enabled: {row[4]}")
                print()
        
        # Check tasks with Jira keys
        print("\n📋 Tasks with Jira Keys:")
        result = conn.execute(sqlalchemy.text("""
            SELECT id, project_id, jira_issue_key, title, status 
            FROM tasks 
            WHERE jira_issue_key IS NOT NULL
            ORDER BY created_at DESC
        """))
        tasks = result.fetchall()
        if not tasks:
            print("   ❌ No tasks with Jira keys found")
        else:
            print(f"   ✅ Found {len(tasks)} task(s) with Jira keys:")
            for row in tasks:
                print(f"      - Task ID: {row[0]}")
                print(f"        Jira Key: {row[2]}")
                print(f"        Title: {row[3][:60] if row[3] else 'No title'}")
                print(f"        Project ID: {row[1]}")
                print(f"        Status: {row[4]}")
                print()
        
        # Check all tasks count
        result = conn.execute(sqlalchemy.text("SELECT COUNT(*) FROM tasks"))
        total_tasks = result.scalar()
        print(f"\n📊 Total tasks in database: {total_tasks}")
        
        # Check recent tasks
        print("\n📋 Recent Tasks (last 5):")
        result = conn.execute(sqlalchemy.text("""
            SELECT id, project_id, jira_issue_key, title, created_at 
            FROM tasks 
            ORDER BY created_at DESC 
            LIMIT 5
        """))
        recent = result.fetchall()
        for row in recent:
            jira_info = f" (Jira: {row[2]})" if row[2] else ""
            print(f"   - {row[3][:50] if row[3] else 'No title'}{jira_info}")
            print(f"     Created: {row[4]}")
            print()
    
    print("=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)
    print("\n💡 Next Steps:")
    print("1. Check backend console logs when creating a Jira issue")
    print("2. Look for '🔔 JIRA WEBHOOK RECEIVED' message")
    print("3. Verify project key matches (Jira issue key prefix)")
    print("4. Check webhook URL in Jira settings")

if __name__ == "__main__":
    main()

