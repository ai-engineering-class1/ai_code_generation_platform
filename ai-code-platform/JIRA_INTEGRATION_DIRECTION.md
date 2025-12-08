# Jira Integration Direction - Current Status

## ⚠️ Important: One-Way Integration

**Currently, the Jira integration is ONE-WAY only:**

```
Jira → Project (✅ Works)
Project → Jira (❌ NOT Implemented)
```

---

## 🔄 Current Integration Flow

### ✅ Jira → Project (IMPLEMENTED)

**How it works:**
1. Issues created in Jira → Sync to Project via webhook or manual sync
2. When a Jira issue is created, it automatically creates a task in your project
3. Tasks have `jira_issue_key` field linking them to Jira

**Methods:**
- **Webhook**: Jira sends webhook when issue created → Task created automatically
- **Manual Sync**: `POST /api/v1/jira/sync/{project_id}` → Pulls all Jira issues

**Example:**
```
1. Create issue "PROJ-123" in Jira
2. Webhook triggers → Task created in project with jira_issue_key = "PROJ-123"
3. Task appears in your project ✅
```

---

### ❌ Project → Jira (NOT IMPLEMENTED)

**Current Behavior:**
- Tasks created from Project **do NOT** create issues in Jira
- Tasks created from Project **do NOT** sync to Jira
- Jira will **NOT** know about these tasks

**Example:**
```
1. Create task "New Feature" in Project (via API/UI)
2. Task exists in project ✅
3. Jira does NOT know about it ❌
4. No Jira issue is created ❌
```

---

## 📊 Integration Scenarios

### Scenario 1: Task Created in Jira
```
Jira Issue Created → Webhook → Task Created in Project ✅
```
**Result:** Task appears in project with `jira_issue_key`

### Scenario 2: Task Created in Project
```
Task Created in Project → Nothing happens → Jira doesn't know ❌
```
**Result:** Task exists only in project, no Jira issue

### Scenario 3: Task Created in Project, Then Manually Created in Jira
```
1. Task created in Project (no Jira issue)
2. Later: Create issue in Jira manually
3. Webhook syncs → Task gets jira_issue_key linked
```
**Result:** Task and Jira issue are linked (if same title/description match)

---

## 🔍 How to Check if Task is Linked to Jira

**In Database:**
```sql
SELECT id, title, jira_issue_key 
FROM tasks 
WHERE project_id = 'your-project-id';
```

**Tasks with Jira link:**
- `jira_issue_key` is NOT NULL (e.g., "PROJ-123")
- These tasks sync with Jira

**Tasks without Jira link:**
- `jira_issue_key` IS NULL
- These tasks exist only in your project
- Jira doesn't know about them

---

## 💡 Workarounds (Current Solutions)

### Option 1: Create in Jira First (Recommended)
```
1. Create issue in Jira
2. Webhook automatically creates task in project
3. Both systems are in sync ✅
```

### Option 2: Manual Sync After Creating in Project
```
1. Create task in Project
2. Manually create corresponding issue in Jira
3. Run sync: POST /api/v1/jira/sync/{project_id}
4. System will link them (if titles match)
```

### Option 3: Use Jira as Source of Truth
```
- Always create tasks in Jira first
- Let webhooks sync to project
- Project becomes a mirror of Jira
```

---

## 🚀 Future Enhancement: Bidirectional Sync

To make Jira know about tasks created in Project, you would need:

### 1. Add Method to Create Jira Issues

```python
# In JiraService
async def create_issue(
    self,
    summary: str,
    description: str,
    issue_type: str,
    priority: str
) -> str:
    """Create a Jira issue and return issue key"""
    # POST to /rest/api/3/issue
    # Return issue key (e.g., "PROJ-123")
```

### 2. Update Task Creation Endpoint

```python
# In tasks.py create_task endpoint
if jira_config and not task.jira_issue_key:
    # Create issue in Jira
    jira_service = JiraService(jira_config)
    issue_key = await jira_service.create_issue(
        summary=task.title,
        description=task.description,
        issue_type=task.type,
        priority=task.priority
    )
    task.jira_issue_key = issue_key
    db.commit()
```

### 3. Handle Updates

```python
# When task is updated, also update Jira issue
if task.jira_issue_key:
    await jira_service.update_issue(
        issue_key=task.jira_issue_key,
        summary=task.title,
        description=task.description
    )
```

---

## 📝 Summary

| Action | Jira → Project | Project → Jira |
|--------|----------------|----------------|
| **Create** | ✅ Automatic (webhook) | ❌ Not implemented |
| **Update** | ✅ Automatic (webhook) | ❌ Not implemented |
| **Delete** | ✅ Automatic (webhook) | ❌ Not implemented |
| **Manual Sync** | ✅ Available | ❌ Not available |

---

## 🎯 Recommendation

**For now:**
- Use Jira as the source of truth
- Create tasks in Jira first
- Let webhooks sync to your project
- This ensures both systems stay in sync

**For future:**
- Implement bidirectional sync
- Allow creating Jira issues from project tasks
- Keep both systems synchronized automatically

---

## 🔗 Related Files

- `backend/app/services/jira_service.py` - Jira API service (read-only currently)
- `backend/app/api/v1/endpoints/jira.py` - Jira endpoints (webhook, sync)
- `backend/app/api/v1/endpoints/tasks.py` - Task endpoints (no Jira creation)

