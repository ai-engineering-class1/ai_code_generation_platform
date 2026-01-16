import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
import redis
from app.core.config import settings
from app.models.rbac import Permission, Role, RolePermission
from app.models.organization import UserRoleAssignment, Organization
from app.models.user import User

# Redis Connection
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class RBACService:
    
    @staticmethod
    def get_cache_key(user_id: str) -> str:
        return f"rbac:user:{user_id}:permissions"

    @staticmethod
    def invalidate_user_cache(user_id: str):
        """
        Clear the permission cache for a specific user.
        Call this when roles are assigned/revoked.
        """
        key = RBACService.get_cache_key(user_id)
        redis_client.delete(key)

    @staticmethod
    def get_user_permissions(db: Session, user_id: str) -> List[dict]:
        """
        Fetch all permissions for a user from DB.
        Returns a list of dicts: {'code': '...', 'scope_org_id': '...'}
        """
        # 1. Join UserRoleAssignment -> Role -> RolePermission -> Permission
        stmt = (
            select(Permission.code, UserRoleAssignment.scope_org_id)
            .join(Role, UserRoleAssignment.role_id == Role.id)
            .join(RolePermission, Role.id == RolePermission.role_id)
            .join(Permission, RolePermission.permission_id == Permission.id)
            .where(UserRoleAssignment.user_id == user_id)
        )
        results = db.execute(stmt).all()
        
        # 2. Format result
        permissions = []
        for code, scope_org_id in results:
            permissions.append({
                "code": code,
                "scope_org_id": scope_org_id # None for global, or OrgUUID
            })
        return permissions

    @staticmethod
    def get_org_ancestors(db: Session, org_id: str) -> List[str]:
        """
        Get all ancestor organization IDs for a given organization.
        Returns [org_id, parent_id, grandparent_id, ...] up to root.
        Example: get_org_ancestors("Dept B") -> ["Dept B", "Company A"]
        """
        from sqlalchemy import text
        
        # PostgreSQL recursive CTE to get all ancestors
        query = text("""
            WITH RECURSIVE org_tree AS (
                -- Base case: start with the given org
                SELECT id, parent_id, 0 as level
                FROM organizations
                WHERE id = :org_id
                
                UNION ALL
                
                -- Recursive case: get parent
                SELECT o.id, o.parent_id, ot.level + 1
                FROM organizations o
                INNER JOIN org_tree ot ON o.id = ot.parent_id
            )
            SELECT id FROM org_tree ORDER BY level
        """)
        
        result = db.execute(query, {"org_id": org_id})
        return [row[0] for row in result]

    @staticmethod
    def check_permission(db: Session, user_id: str, permission_code: str, scope_org_id: Optional[str] = None) -> bool:
        """
        Check if user has a permission.
        Uses Redis Caching (2-Layer).
        Implements bottom-up inheritance: users in child orgs can access parent org resources.
        
        Example:
        - Alice (assigned to Dept B) accessing Project1 (Company A):
          - Get ancestors of Alice's org (Dept B) = ["Dept B", "Company A"]
          - Project1 is in "Company A"
          - "Company A" is in Alice's ancestors -> ALLOW
        """
        key = RBACService.get_cache_key(user_id)
        
        # 1. Check Cache
        cached_data = redis_client.get(key)
        user_perms = []
        
        if cached_data:
            user_perms = json.loads(cached_data)
        else:
            # 2. Cache Miss -> Fetch DB
            user_perms = RBACService.get_user_permissions(db, user_id)
            # Store in Redis
            redis_client.setex(key, settings.RBAC_CACHE_TTL_SECONDS, json.dumps(user_perms))
            
        # 3. Validation Logic
        for perm in user_perms:
            if perm["code"] == permission_code:
                # A. Global Permission (scope_org_id is None) -> Applies everywhere
                if perm["scope_org_id"] is None:
                    return True
                
                # B. Direct Scope Match
                # User assigned to "Dept B" accessing "Dept B" project
                if scope_org_id and perm["scope_org_id"] == scope_org_id:
                    return True
                
                # C. Ancestor Match (Bottom-Up Inheritance)
                # User assigned to "Dept B" accessing "Company A" project
                # Get ancestors of user's assigned org
                if perm["scope_org_id"]:
                    user_org_ancestors = RBACService.get_org_ancestors(db, perm["scope_org_id"])
                    # Check if the project's org is in the user's ancestor chain
                    if scope_org_id in user_org_ancestors:
                        return True
                    
        return False

    @staticmethod
    def assign_role(db: Session, user_id: str, role_name: str, scope_org_id: Optional[str] = None):
        """
        Assign a role to a user. Invalidates cache.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
            
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise ValueError(f"Role {role_name} not found")
        
        # Create Assignment
        assignment = UserRoleAssignment(
            user_id=user_id,
            role_id=role.id,
            scope_org_id=scope_org_id
        )
        db.add(assignment)
        db.commit()
        
        # Invalidate Cache
        RBACService.invalidate_user_cache(user_id)
        return assignment
