#!/usr/bin/env python3
"""
Quick script to get user IDs for task assignment testing
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
import sqlalchemy

def main():
    print("=" * 60)
    print("USER LIST - For Task Assignment")
    print("=" * 60)
    
    with engine.connect() as conn:
        result = conn.execute(sqlalchemy.text("""
            SELECT id, email, name, role, is_active
            FROM users
            ORDER BY created_at
        """))
        users = result.fetchall()
        
        if not users:
            print("\n❌ No users found in database")
        else:
            print(f"\n✅ Found {len(users)} user(s):\n")
            for row in users:
                status = "✅ Active" if row[4] else "❌ Inactive"
                print(f"   User ID: {row[0]}")
                print(f"   Email: {row[1]}")
                print(f"   Name: {row[2]}")
                print(f"   Role: {row[3]}")
                print(f"   Status: {status}")
                print()
        
        print("=" * 60)
        print("HOW TO USE:")
        print("=" * 60)
        print("\n1. Copy a User ID from above")
        print("2. Go to your project → New Task")
        print("3. Paste the User ID in the 'Assignee' field")
        print("4. Create the task")
        print("5. Run: python check_notifications.py")
        print("6. You should see a notification for that user!")
        print("\n💡 To test notifications, assign to a DIFFERENT user than yourself!")

if __name__ == "__main__":
    main()

