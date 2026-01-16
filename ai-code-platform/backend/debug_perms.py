import sys
import os
from sqlalchemy import text
from app.core.database import SessionLocal

def debug_perms():
    db = SessionLocal()
    try:
        print("1. Counting existing permissions...")
        result = db.execute(text("SELECT count(*) FROM permissions"))
        count = result.scalar()
        print(f"   Count: {count}")

        print("2. Attempting to seed 'proj:view'...")
        import uuid
        pid = str(uuid.uuid4())
        # Try raw insert
        db.execute(text(f"INSERT INTO permissions (id, code, name, type) VALUES ('{pid}', 'proj:view:debug', 'Debug View', 'menu')"))
        db.commit()
        print("   Success! Inserted proj:view:debug")
        
        print("3. Attempting CLEANUP (Delete All)...")
        db.execute(text("DELETE FROM role_permissions"))
        db.execute(text("DELETE FROM permissions"))
        db.commit()
        print("   Success! Tables cleared.")

    except Exception as e:
        print(f"!!! ERROR: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_perms()
