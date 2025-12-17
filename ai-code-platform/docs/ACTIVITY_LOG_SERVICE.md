# Activity Log Service Guide

The `ActivityLogService` is the centralized way to track agent and system behaviors. It enforces the **STAR Framework** (Situation, Task, Action, Result) and strictly manages the lifecycle of an activity.

## Core Concepts

1.  **Active Activity**: An activity currently in progress (`activity_end_at` is `None`). Typically has `Status=IN_PROGRESS` or `PENDING_USER_INPUT`. Functional fields (Action, Situation) are mutable.
2.  **Activity Log**: A completed activity (`activity_end_at` is set). Typically has `Status=COMPLETED` or `FAILED`. It is **Frozen** and immutable, with the exception of the `Tie-back` field and `workflow_metadata`.
3.  **Workflow Metadata**: Semi-structured data (JSON) used for orchestration (e.g., `parent_activity_id`, `branch_name`). It remains **Mutable** across all statuses to allow for updates like "Specification Readiness" or "PR Status" even after the activity step is technically closed.

## Usage Lifecycle

### 1. Start Activity (Initialization)
Call this when an agent begins a discrete step.

```python
from app.services.activity_log_service import ActivityLogService
from app.models.task import ActivityStatus

service = ActivityLogService()

activity = service.start_activity(
    db=db,
    task_id=task.id,
    title="Running Unit Tests",
    operator_id="TestRunner-Agent",
    activity_type="agent_action",
    situation="Code generation completed. Verifying logic.",
    task_role="Ensure code meets quality standards."
)
# Activity is now IN_PROGRESS.
```

### 2. Update Activity (Execution)
Call this to stream actions or refine the situation context while working.
*   **Allowed**: Updating `action`, `situation` (via metadata).
*   **Forbidden**: Updating `result` or `status`.

```python
service.update_activity(
    db=db,
    activity_id=activity.id,
    action="Executing test suite 'tests/test_auth.py'..."
)
```

### 3. Stream Action (Streaming)
Call this to append text to the current action without overwriting it.

```python
service.append_activity_action(
    db=db,
    activity_id=activity.id,
    action_chunk="... Test 1 Passed.\n"
)
```

### 4. End Activity (Conclusion)
Call this when the step is finished. This **Freezes** the activity.
*   **Required**: `result`.
*   **Effect**: Sets `activity_end_at = Now`. Previous fields (Situation, Action) become Read-Only.

```python
service.end_activity(
    db=db,
    activity_id=activity.id,
    result="All 15 tests passed.",
    status=ActivityStatus.COMPLETED,
    tie_back="Verification successful. Ready for PR."
)
```

### 4. Post-Analysis (Archived)
Call this from nightly jobs or analysis agents to add insights to old records.
*   **Allowed**: `tie_back` ONLY.
*   **Forbidden**: Changing history (Action, Result, Situation).

```python
service.update_tie_back(
    db=db,
    activity_id=activity.id,
    tie_back="This test suite has passed 5 times in a row. Stability increased."
)
```

## Architecture Note: Frontend vs Backend Polling

**Current Strategy: Frontend-Driven Sync**
For the current "Demo" phase, the Frontend is responsible for:
1.  Polling the Remote Agent status.
2.  Pushing updates to the Activity Log (via `append_activity_action`).
3.  Finalizing the Activity (via `end_activity`) when the Remote Agent finishes.

**Trade-off**: If the user closes the browser, the Activity Log update process will stop (The remote agent continues running, but our log won't reflect the result until someone opens the page again).

**Future Improvement (Robustness)**:
Move the polling logic to a background worker (e.g., Celery/Redis Queue). The worker would independently monitor the Remote Agent and update the Activity Log, ensuring data consistency even without an active browser session.

## STAR-T Lifecycle Matrix

| Stage | Method | Status | Mutable Fields | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Start** | `start_activity` | `IN_PROGRESS` | **S, T, Meta** | Define context & goal. |
| **Exec** | `update_activity` | `IN_PROGRESS` | **A, S, Meta** | Log actions & refinements. |
| **Exec** | `append_activity_action` | `IN_PROGRESS` | **A (Append)** | Stream log actions. |
| **End** | `end_activity` | `COMPLETED` | **R, T, Status, Meta** | Seal with a result. |
| **Archive**| `update_tie_back`| `COMPLETED` | **T, Meta** | Add hindsight insights. |

## Error Handling

*   **ValueError**: Raised if you try to `update_activity` or `end_activity` on a record that is already frozen (completed).

## Workflow Metadata Usage Examples

The `workflow_metadata` field is a versatile JSON objects designed to support orchestration, orchestration state, and HITL (Human-In-The-Loop) contexts. Here are some common usage patterns:

### 1. Human-In-The-Loop (HITL) Context
Stores state for manual interventions, approval flows, and recommended user actions.

```json
{
  "severity": "medium",
  "requires_approval": true,
  "source_activity": "34234-abc-567",
  "branch_name": "hotfix/remove-duplication",
  "specification_readiness": false,
  "suggested_actions": [
    "Review auth logic",
    "Check potential deadlock"
  ]
}
```

### 2. Orchestration & Control Flow
Tracks linkage between distributed components or long-running processes.

```json
{
  "parent_process_id": "orchestrator-001",
  "retry_count": 2,
  "next_step": "deploy_staging",
  "timeout_threshold_sec": 300
}
```

### 3. Debugging & Traceability
Snapshots of system state relevant to the specific activity iteration.

```json
{
  "git_pull_request_id": "#15",
  "git_commit_sha": "a1b2c3d4",
  "environment": "staging",
  "feature_flags": {
    "new_ui": true,
    "beta_api": false
  }
}
```
### 4. Remote Task Context
Logs the remote task's metadata.

```json
{
  "remote_task_id": "1Tlpie9QIxovioFK8IJyE",
  "remote_status": "dispatched"
}
```
