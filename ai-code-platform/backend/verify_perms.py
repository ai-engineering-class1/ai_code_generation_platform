from sqlalchemy import text
from app.core.database import SessionLocal

db = SessionLocal()
try:
    # Count permissions
    result = db.execute(text("SELECT COUNT(*) FROM permissions"))
    perm_count = result.scalar()
    print(f"Total Permissions: {perm_count}")
    
    # Count roles
    result = db.execute(text("SELECT COUNT(*) FROM roles"))
    role_count = result.scalar()
    print(f"Total Roles: {role_count}")
    
    # Show sample permissions
    result = db.execute(text("SELECT code, name, type FROM permissions LIMIT 5"))
    print("\nSample Permissions:")
    for row in result:
        print(f"  - {row[0]}: {row[1]} ({row[2]})")
        
    # Show roles
    result = db.execute(text("SELECT name, description FROM roles"))
    print("\nRoles:")
    for row in result:
        print(f"  - {row[0]}: {row[1]}")
        
finally:
    db.close()
