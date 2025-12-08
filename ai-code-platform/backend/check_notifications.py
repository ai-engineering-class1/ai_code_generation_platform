#!/usr/bin/env python3
"""
Quick script to check notifications in the database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
import sqlalchemy

def main():
    print("=" * 60)
    print("NOTIFICATION CHECKER")
    print("=" * 60)
    
    with engine.connect() as conn:
        # Get recent notifications
        print("\n📋 Recent Notifications (last 10):")
        result = conn.execute(sqlalchemy.text("""
            SELECT 
                n.id,
                u.email as user_email,
                u.name as user_name,
                t.title as task_title,
                t.jira_issue_key,
                n.type,
                n.title as notification_title,
                n.message,
                n.read,
                n.created_at
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            LEFT JOIN tasks t ON n.task_id = t.id
            ORDER BY n.created_at DESC
            LIMIT 10
        """))
        notifications = result.fetchall()
        
        if not notifications:
            print("   ❌ No notifications found")
        else:
            print(f"   ✅ Found {len(notifications)} notification(s):\n")
            for row in notifications:
                read_status = "✅ Read" if row[8] else "📬 Unread"
                jira_info = f" (Jira: {row[4]})" if row[4] else ""
                print(f"   📬 Notification ID: {row[0]}")
                print(f"      User: {row[1]} ({row[2]})")
                print(f"      Task: {row[3]}{jira_info}")
                print(f"      Type: {row[5]}")
                print(f"      Title: {row[6]}")
                print(f"      Message: {row[7][:80] if row[7] else 'No message'}...")
                print(f"      Status: {read_status}")
                print(f"      Created: {row[9]}")
                print()
        
        # Count by type
        print("\n📊 Notification Statistics:")
        result = conn.execute(sqlalchemy.text("""
            SELECT 
                type,
                COUNT(*) as count,
                SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
            FROM notifications
            GROUP BY type
            ORDER BY count DESC
        """))
        stats = result.fetchall()
        for row in stats:
            print(f"   {row[0]}: {row[1]} total ({row[2]} unread)")
        
        # Count by user
        print("\n👥 Notifications by User:")
        result = conn.execute(sqlalchemy.text("""
            SELECT 
                u.email,
                COUNT(*) as total,
                SUM(CASE WHEN n.read = false THEN 1 ELSE 0 END) as unread
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            GROUP BY u.email
            ORDER BY total DESC
            LIMIT 5
        """))
        user_stats = result.fetchall()
        for row in user_stats:
            print(f"   {row[0]}: {row[1]} total ({row[2]} unread)")
        
        # Recent task assignments
        print("\n📋 Recent Task Assignment Notifications:")
        result = conn.execute(sqlalchemy.text("""
            SELECT 
                n.id,
                u.email,
                t.title,
                n.created_at
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            LEFT JOIN tasks t ON n.task_id = t.id
            WHERE n.title LIKE 'Task Assigned%'
            ORDER BY n.created_at DESC
            LIMIT 5
        """))
        assignments = result.fetchall()
        if not assignments:
            print("   ❌ No task assignment notifications found")
        else:
            for row in assignments:
                print(f"   ✅ {row[1]} assigned to '{row[2]}' at {row[3]}")
    
    print("\n" + "=" * 60)
    print("CHECK COMPLETE")
    print("=" * 60)
    print("\n💡 To test assignment notification:")
    print("   1. Create a task in your project")
    print("   2. Assign it to a different user")
    print("   3. Run this script again to see the notification!")

if __name__ == "__main__":
    main()

