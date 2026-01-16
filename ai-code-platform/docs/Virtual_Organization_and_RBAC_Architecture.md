# Virtual Organization Management - Design Proposal (Rev 2)

## 1. Unified RBAC & Organization Strategy (Industry Best Practice)
**Goal**: Unify "System Roles" and "Organization Roles" into a single flexible permission system.

The proposed design follows the **NIST RBAC (Level 3 - Hierarchical RBAC)** and **SaaS Multi-Tenant Best Practices**.

### 1.1 Why this is the Best Practice?
1.  **Uniformity**: Instead of maintaining two separate systems (one for "App Admins" and one for "Org Members"), we use a single **Role** concept.
2.  **Scopes (Context-Aware)**: This satisfies the "Virtual Organization" requirement. A user can be an `Admin` of "Department A" but only a `Viewer` of "Department B". This is the standard model used by platforms like **AWS IAM**, **GitHub**, and **GCP**.
3.  **Scalability**: New features (e.g., "Auditor" access) only require creating a new Role record in the database, not changing code/Enums.

### 1.2 Core Concepts
*   **Permission**: A fine-grained atomic action (e.g., `task:create`, `org:billing:view`).
*   **Role**: A named collection of permissions (e.g., "System Admin", "Department Manager").
*   **Scope (The Key Differentiator)**:
    *   **Global Scope**: The role applies to the entire system (e.g., "Super Admin").
    *   **Organization Scope**: The role applies to a specific Organization and inherits down to its children (Cascading Permissions).

### 1.3 Implemented Services
The architecture is powered by the following core backend services:
*   **`app/services/rbac_service.py`**: The logic engine for permission checking. Implements the Redis Caching layer and Invalidation logic.
*   **`app/services/organization_service.py`**: Manages the CRUD operations for Organization nodes and hierarchy traversal (billing rollups).
*   **`app/services/subscription_service.py`**: Handles event subscription and logic to resolve "Group" recipients into individual User lists.
*   **`app/core/deps.py`**: Contains the `RequirePermission` FastAPI dependency for protecting API endpoints.

## 2. Database Schema Design (SQLAlchemy)

### 2.1 Permissions & Roles (Enhanced with UI Support)
Borrowing from best practices (and the provided sample), permissions will also drive the UI (Menus).

```python
class PermissionType(str, enum.Enum):
    MENU = "menu"       # Viewable menu item
    BUTTON = "button"   # Action button
    API = "api"         # Backend API endpoint

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False) # e.g., "sys:user:view"
    name = Column(String, nullable=False)              # e.g., "User Management"
    type = Column(Enum(PermissionType), default=PermissionType.MENU)
    
    # Hierarchy (for Menu nesting)
    parent_id = Column(String, ForeignKey("permissions.id"), nullable=True)
    
    # UI Metadata
    path = Column(String) # Frontend route e.g., "/users"
    icon = Column(String) # Icon name e.g., "user-group"
    sort_order = Column(Integer, default=0)

class Role(Base):
    __tablename__ = "roles"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    is_system_role = Column(Boolean, default=False)
    
    permissions = relationship("Permission", secondary="role_permissions")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(String, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(String, ForeignKey("permissions.id"), primary_key=True)
```

### 2.2 Organizations (Virtual Structures)
Adjacency List + Recursive CTE.

```python
class OrganizationType(str, enum.Enum):
    CORPORATION = "corporation"
    DEPARTMENT = "department"
    GROUP = "group"  # Used for generic collections (e.g., "Notification Subscribers")
    BOARD = "board"

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    type = Column(Enum(OrganizationType), nullable=False)
    # ... hierarchy columns ...
```

### 2.3 User Role Assignments (The Unifier)
Instead of separate`User.role` and `OrganizationMember`, we use a single table:
```python
class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    
    # scope_id is NULL for Global Roles, or an Organization ID for scoped roles
    scope_org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    
    user = relationship("User", back_populates="role_assignments")
    role = relationship("Role")
    organization = relationship("Organization")
```

## 3. Revised Logic

### 3.1 Permission Checking
`check_permission(user, permission_name, scope_org_id=None)`

Algorithm:
1.  **Global Check**: Does user have a Role with `permission_name` where `scope_org_id IS NULL`? -> Allow.
2.  **Direct Scope Check**: If `scope_org_id` provided, does user have Role with `permission_name` where `scope_org_id == target_id`? -> Allow.
3.  **Ancestry Check**: (If cascading permitted) Check parental organizations with Recursive CTE.

### 3.2 Legacy Compatibility
*   Existing `User.role` (Enum) will be migrated to the new `user_role_assignments` table.
*   "ADMIN" -> Global Role "System Admin"
*   "DEVELOPER" -> Global Role "Developer"

### 3.3 Policies, Billing & Subscriptions
*   **Billing**: Uses `billing_parent_id` to roll up costs to a "Corporation" node.
*   **Cross-Org Policies**: `OrganizationPolicy` table handles "Org A needs approval from Org B".

### 3.4 Subscriptions & Notification Routing (Mandatory vs. Voluntary)
To address the need for both "Mandatory Workflow Actions" and "Voluntary Observing", we introduce a dedicated **Subscription** model that links an *Event Source* to a *Recipient* (User or Group).

```python
class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True)
    # The "Topic" (e.g., "workflow:123", "repo:main", "org:marketing")
    source_type = Column(String, nullable=False) 
    source_id = Column(String, nullable=False)
    
    # The Recipient
    recipient_type = Column(String) # 'user' or 'group' (Organization)
    recipient_id = Column(String)
    
    # Configuration
    is_mandatory = Column(Boolean, default=False) # True = Actions required, cannot unsubscribe
    notification_channel = Column(String, default="in_app") # e.g., 'email', 'slack'
```

**Use Cases**:
1.  **Mandatory Workflow Logic**: The System creates a `Subscription(source="workflow:101", recipient="ApproversGroup", is_mandatory=True)`. The members of "ApproversGroup" *must* act on it.
2.  **Voluntary Observer**: Alice clicks "Subscribe" on Project X. System creates `Subscription(source="project:X", recipient="Alice", is_mandatory=False)`.
3.  **Group Routing**: If Recipient is a **Group Organization**, the system resolves all members of that group (via RBAC) and notifies them. This keeps the "Who is in the group" logic (RBAC) separate from "What does the group watch" logic (Subscription).

## 4. Performance & Caching Strategy
To mitigate the cost of recursive queries and multiple table joins, we will implement a **2-Layer Caching Strategy** using the existing **Redis** infrastructure.

### 4.1 Cache Keys
*   `rbac:user:{user_id}:permissions` -> JSON List of all permissions (Global + Organization Scoped).
*   `rbac:org:{org_id}:hierarchy` -> Cached flat list of ancestor IDs for fast tree traversal.

### 4.2 Logic
1.  **On Login / Token Valid**: Fetch all user permissions and store in Redis (TTL 10 mins).
2.  **On `check_permission`**:
    *   Check Cache. If required permission exists ensuring correct scope -> Return True.
    *   If Miss -> DB Query -> Populate Cache -> Return Result.
3.  **Invalidation (Cache Busting)**:
    *   When `UserRoleAssignment` changes -> Delete `rbac:user:{user_id}:permissions`.
    *   When `Role` definition changes -> Broadcast clear or short TTL usage.

## 5. Pros/Cons
*   **Pros**: Unified permission logic. "System Admin" is just a role. Scalable. High performance with Redis.
*   **Cons**: Requires migration of existing user roles. Caching adds slight application layer complexity.

### 5.1 Project Visibility & Defaulting Logic
The system enforces a secure-by-default visibility model based on Organization Scopes.

**Workflow:**
1.  **Creation**: A User creates a Project.
2.  **Default Scope**: If no specific Organization is selected, the system defaults the Project's scope (`organization_id`) to the User's primary Organization (e.g., "Engineering").
3.  **Visibility Rules**:
    *   **Team Members**: Colleagues in the same Organization (assignments with `scope_org_id = Engineering`) inherit access.
    *   **External Users**: Users in other Organizations (e.g., "Marketing") are denied access unless explicitly added.
5.  **Cross-Team Collaboration**: To grant access to users from multiple departments:
    *   Create a new Organization node (e.g., `org_project123`, type: `GROUP`)
    *   Assign all required users to this Organization via `UserRoleAssignment`
    *   Set the Project's `organization_id` to this new Organization
    *   Example: Users A, B (from DeptA) and C (from DeptB) can collaborate on Project123 by all being assigned to `org_project123`
6.  **UI Implementation (Pending)**: The Frontend "Create Project" form must include an Organization Dropdown (populated with the user's memberships) to allow selecting a different scope (e.g., "Company Wide" or "Special Task Force"). Currently, this defaults to the primary org automatically.

## 6. Access Control Logic (API Implementation)
We replace decorators with a standardized **FastAPI Dependency** that leverages the cached RBAC check.

```python
class RequirePermission:
    def __init__(self, permission_code: str):
        self.permission_code = permission_code
        
    def __call__(self, user=Depends(get_current_active_user), db=Depends(get_db)):
        if not RBACService.check_permission(db, user, self.permission_code):
             raise HTTPException(status_code=403, detail="Forbidden")
        return user

# Usage
@router.post("/projects")
def create_project(user: User = Depends(RequirePermission("proj:create"))):
    ...
```

## 7. Migration Plan
1.  **Phase 1 (Immediately)**: Create tables, Seed Roles (Manager, Developer, QA, Author), Seed Permissions, Migrated Users.
2.  **Phase 2**: Update API endpoints to use `Depends(RequirePermission(...))` instead of `@role_required`.
3.  **Phase 3**: Frontend updates to fetch menu from `/api/permissions/menu`.
