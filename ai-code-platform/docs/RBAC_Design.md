# Role-Based Access Control (RBAC) Design

This document outlines the design for the Role-Based Access Control (RBAC) system for the AI Code Generation Platform. This system ensures that users and automation agents have appropriate access levels to resources based on their assigned roles.

## 1. Overview
The goal is to move from the current "open access" model to a secure, role-based model where permissions are explicitly granted. This system applies equally to human users and **Automation Agents** (e.g., Claude, specialized AI workers), treating agents as first-class users with distinct roles.

## 2. Core Roles

We define four primary roles for the platform:

| Role | Description | Primary Focus |
| :--- | :--- | :--- |
| **Manager** | Project administrator and team lead. | Project Config, User Management, Final Approvals. |
| **Developer** | Technical contributor implementing features. | Code Gen, Pull Requests, Technical Implementation. |
| **QA_Tester** | Quality assurance specialist. | Testing, Validation, moving tasks to "Done". |
| **Author** | Content/Requirement creator. | Writing Specs, Creating Tasks, defining scope. |

### 2.1. Role Definitions

#### **Manager**
The **Manager** has full control over a project. They are responsible for the lifecycle of the project, including configuration (Jira/GitHub connections), team management, and final overrides.
*   **Typical User**: Engineering Manager, Tech Lead.
*   **Agent Equivalent**: "Project Manager Agent" (capable of reorganizing tasks or adjusting project settings).

#### **Developer**
The **Developer** is responsible for executing tasks. They interact mostly with the code generation, GitHub PRs, and technical details.
*   **Typical User**: Software Engineer.
*   **Agent Equivalent**: "Coding Agent" (e.g., the current Claude Code Generator).

#### **QA_Tester**
The **QA_Tester** focuses on validation. They ensure that implemented tasks meet the requirements defined in the specification. They have authority to reject tasks or mark them as verifying/completed.
*   **Typical User**: QA Engineer, Tester.
*   **Agent Equivalent**: "QA Agent" (runs automated test suites, reviews PRs for bugs).

#### **Author**
The **Author** is the creative force behind the requirements. They create new Tasks and write Specifications (OpenSpec). They hold the vision of *what* needs to be built.
*   **Typical User**: Product Owner, Business Analyst, Prompt Engineer.
*   **Agent Equivalent**: "Spec Writer Agent" (converts vague user requests into detailed OpenSpec documents).

---

## 3. Permissions Matrix

The following table defines the granular permissions for each role at the **Project Level**.

**Legend:**
*   ✅ = Allowed
*   ❌ = Denied
*   👁️ = View Only

| Permission Category | Action | Manager | Developer | QA_Tester | Author |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Project Management** | Create Project | ✅ | ❌ | ❌ | ✅ |
| | Delete Project | ✅ | ❌ | ❌ | ❌ |
| | Update Settings (Jira/GH) | ✅ | ❌ | ❌ | ❌ |
| | Manage Members | ✅ | ❌ | ❌ | ❌ |
| **Task Management** | Create Task | ✅ | ✅ | ❌ | ✅ |
| | Edit Task Details | ✅ | ✅ | ❌ | ✅ |
| | Delete Task | ✅ | ❌ | ❌ | ✅ |
| | Assign/Reassign Task | ✅ | ✅ | ❌ | ✅ |
| **Specification** | Create/Edit Spec (OpenSpec) | ✅ | ✅ | 👁️ | ✅ |
| | Approve Spec | ✅ | ❌ | ❌ | ✅ |
| **Execution** | Trigger Code Generation | ✅ | ✅ | ❌ | ❌ |
| | Open Terminal / Shell | ✅ | ✅ | ❌ | ❌ |
| | View Source Code | ✅ | ✅ | ✅ | ✅ |
| **Workflow** | Mark as "In Progress" | ✅ | ✅ | ❌ | ❌ |
| | Mark as "Ready for QA" | ✅ | ✅ | ❌ | ❌ |
| | Mark as "Completed" (Pass QA) | ✅ | ❌ | ✅ | ❌ |
| | Mark as "Failed/Blocked" | ✅ | ✅ | ✅ | ❌ |

---

## 4. Automation Agents & RBAC

Automation Agents are treated as **Users** in the system database but valid flags indicating they are non-human. This allows strict enforcement of permissions even for AI.

### 4.1. Agent Identity
*   **User Table**: Agents have rows in the `users` table (e.g., `email="agent-coder@platform.bot"`).
*   **Authentication**: Agents authenticate via API Keys with associated User IDs.

### 4.2. Example Scenarios

1.  **Coding Agent (Developer Role)**
    *   *Scenario*: Triggered to implement a task.
    *   *Access*: Can read the Spec, trigger the GitHub workflow, and update the task status to "In Progress".
    *   *Restriction*: Cannot change the Project's Jira settings or delete the Project.

2.  **Spec Refiner Agent (Author Role)**
    *   *Scenario*: User provides a one-sentence prompt. The agent expands it into a full OpenSpec.
    *   *Access*: Can Create Specification and Update Specification.
    *   *Restriction*: Cannot trigger the "Generate Code" pipeline (that requires a Developer) or Approve their own spec (requires a human Manager/Author review, possibly).

3.  **Triage Agent (Manager Role)**
    *   *Scenario*: An agent monitors incoming Jira tickets and creates corresponding Platform Tasks.
    *   *Access*: Can Create Tasks and Assign them to Developers.

## 5. Implementation Roadmap

### Phase 1: Database Schema Updates
1.  **Roles Table** (Optional, or use Enum): Define `Role` Enum in Code.
2.  **User_Project_Role Table**: A many-to-many relationship table linking `Users` to `Projects` with a specific `Role`.
    *   `user_id` (FK)
    *   `project_id` (FK)
    *   `role` (Enum: Manager, Developer, QA, Author)

### Phase 2: Backend Middleware
1.  **Permission Dependency**: Create a FastAPI dependency `check_permission(resource, action)` that checks the current user's role against the requested action.
2.  **Endpoint Protection**: Decorate endpoints with these checks.
    *   *Example*: `@router.delete("/projects/{id}")` -> `Depends(require_role(Role.MANAGER))`

### Phase 3: Frontend Adaptation
1.  **UI Gating**: Hide buttons (e.g., "Delete Project", "Settings") based on the logged-in user's role.
2.  **Role Display**: Show the user's role in the Project Header (e.g., "Project / AI Platform (Developer)").

## 6. Access Control Logic (Pseudo-code)

```python
def has_permission(user: User, project: Project, action: Action) -> bool:
    # 1. Get User's Role in this Project
    user_role = db.query(UserProjectRole).filter(
        user_id=user.id, 
        project_id=project.id
    ).first()

    if not user_role:
        return False # No access

    role = user_role.role

    # 2. Check Permission Matrix
    if action == Action.DELETE_PROJECT:
        return role == Role.MANAGER
    
    if action == Action.GENERATE_CODE:
        return role in [Role.MANAGER, Role.DEVELOPER]
        
    if action == Action.APPROVE_SPEC:
        return role in [Role.MANAGER, Role.AUTHOR]

    # ... permissions logic ...
    
    return False
```
