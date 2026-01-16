from fastapi import Depends, HTTPException, status
from app.core.security import get_current_active_user
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.rbac_service import RBACService

class RequirePermission:
    def __init__(self, permission_code: str):
        self.permission_code = permission_code

    def __call__(self, user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        # 1. Scope resolution could be tricky here (e.g. from URL param).
        # For simple Global/Project check, we might pass project_id via other dependency,
        # but for now let's assume Global or we extract scope inside.
        
        # NOTE: To handle dynamic scope (like project_id from URL), 
        # we usually need a more advanced dependency that parses the Request.
        
        has_perm = RBACService.check_permission(db, user.id, self.permission_code)
        
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {self.permission_code} required"
            )
        return user

# Usage:
# @router.post("/projects")
# def create_project(user: User = Depends(RequirePermission("proj:create"))):
#    ...
