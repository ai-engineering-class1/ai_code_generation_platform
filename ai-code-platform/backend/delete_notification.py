#!/usr/bin/env python3
"""
Script to find and delete notifications by title or ID.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.notification import Notification
from app.models.user import User
from app.core.database import get_sync_database_url
from app.core.config import settings

# Create database session
sync_database_url = get_sync_database_url(settings.DATABASE_URL)
engine = create_engine(sync_database_url, echo=False)
SessionLocal = sessionmaker(bind=engine)

def list_notifications(search_term: str = None):
    """List notifications, optionally filtered by search term"""
    db = SessionLocal()
    try:
        query = db.query(Notification).join(User)
        
        if search_term:
            query = query.filter(
                (Notification.title.ilike(f'%{search_term}%')) |
                (Notification.message.ilike(f'%{search_term}%'))
            )
        
        notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
        
        if not notifications:
            print("No notifications found.")
            return []
        
        print(f"\nFound {len(notifications)} notification(s):\n")
        for i, notif in enumerate(notifications, 1):
            user = db.query(User).filter(User.id == notif.user_id).first()
            username = user.email if user else "Unknown"
            print(f"{i}. ID: {notif.id}")
            print(f"   User: {username}")
            print(f"   Title: {notif.title}")
            print(f"   Message: {notif.message[:100] if notif.message else 'N/A'}")
            print(f"   Read: {notif.read}")
            print(f"   Created: {notif.created_at}")
            print()
        
        return notifications
    finally:
        db.close()

def delete_notification(notification_id: str):
    """Delete a notification by ID"""
    db = SessionLocal()
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        
        if not notification:
            print(f"Notification {notification_id} not found.")
            return False
        
        print(f"\nDeleting notification:")
        print(f"  ID: {notification.id}")
        print(f"  Title: {notification.title}")
        print(f"  Message: {notification.message[:100] if notification.message else 'N/A'}")
        
        db.delete(notification)
        db.commit()
        
        print(f"\n✓ Notification deleted successfully!")
        return True
    except Exception as e:
        print(f"\n✗ Error deleting notification: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    print("=" * 60)
    print("Notification Management Script")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        # If search term provided, search and optionally delete
        search_term = sys.argv[1]
        print(f"Searching for notifications containing: '{search_term}'\n")
        notifications = list_notifications(search_term)
        
        if notifications:
            print("\n" + "=" * 60)
            choice = input("Enter notification number to delete (or 'q' to quit): ").strip()
            
            if choice.lower() == 'q':
                print("Cancelled.")
                return
            
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(notifications):
                    notification = notifications[idx]
                    confirm = input(f"\nDelete notification '{notification.title}'? (yes/no): ").strip().lower()
                    if confirm == 'yes':
                        delete_notification(notification.id)
                    else:
                        print("Cancelled.")
                else:
                    print("Invalid number.")
            except ValueError:
                print("Invalid input.")
    else:
        # Interactive mode
        print("Options:")
        print("1. List all notifications")
        print("2. Search notifications")
        print("3. Delete notification by ID")
        print()
        
        choice = input("Enter your choice (1-3): ").strip()
        
        if choice == "1":
            list_notifications()
        elif choice == "2":
            search_term = input("\nEnter search term: ").strip()
            notifications = list_notifications(search_term)
            if notifications:
                print("\n" + "=" * 60)
                delete_choice = input("Enter notification number to delete (or 'q' to quit): ").strip()
                if delete_choice.lower() != 'q':
                    try:
                        idx = int(delete_choice) - 1
                        if 0 <= idx < len(notifications):
                            notification = notifications[idx]
                            confirm = input(f"\nDelete notification '{notification.title}'? (yes/no): ").strip().lower()
                            if confirm == 'yes':
                                delete_notification(notification.id)
        elif choice == "3":
            notification_id = input("\nEnter notification ID: ").strip()
            delete_notification(notification_id)
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)
