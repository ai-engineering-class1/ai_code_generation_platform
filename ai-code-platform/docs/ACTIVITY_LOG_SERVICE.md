# Activity Log Service Guide

The `ActivityLogService` is the centralized way to track agent and system behaviors. It enforces the **STAR Framework** (Situation, Task, Action, Result) and strictly manages the lifecycle of an activity.

## Core Concepts

1.  **Active Activity**: An activity currently in progress (`Status=IN_PROGRESS`). Functional fields (Action, Situation) are mutable.
2.  **Activity Log**: A completed activity (`Status=COMPLETED/FAILED`). It is **Frozen** and immutable, with the exception of the `Tie-back` field.

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

## STAR-T Lifecycle Matrix

| Stage | Method | Status | Mutable Fields | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Start** | `start_activity` | `IN_PROGRESS` | **S, T** | Define context & goal. |
| **Exec** | `update_activity` | `IN_PROGRESS` | **A, S** | Log actions & refinements. |
| **Exec** | `append_activity_action` | `IN_PROGRESS` | **A (Append)** | Stream log actions. |
| **End** | `end_activity` | `COMPLETED` | **R, T, Status** | Seal with a result. |
| **Archive**| `update_tie_back`| `COMPLETED` | **T** only | Add hindsight insights. |

## Error Handling

*   **ValueError**: Raised if you try to `update_activity` or `end_activity` on a record that is already frozen (completed).
