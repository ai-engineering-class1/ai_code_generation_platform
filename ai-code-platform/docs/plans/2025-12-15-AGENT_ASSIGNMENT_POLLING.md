# Agent Assignment & Polling Architecture

## Overview
This document outlines the architecture for assigning tasks to the Remote Agent (Claude Web API) and handling the asynchronous response lifecycle, specifically addressing the transition from a simple "Frontend Driven" approach to a robust "Backend Worker" approach.

---

## Phase 1: Frontend-Driven Sync (Current Implementation)
**Goal**: Quick "Demo-ready" implementation leveraging existing frontend polling infrastructure.

### Assignment Flow
1.  **User Trigger**: User clicks "Assign Agent" on Task Page.
2.  **API Call**: `POST /projects/{id}/tasks/{id}/assign`
    *   **STAR Start**: Backend creates Activity ("Remote Agent Execution").
    *   **Dispatch**: Backend calls Remote Agent API.
    *   **STAR Update**: Backend updates Activity with `remote_task_id` and "Dispatched" status.
3.  **Return**: Frontend receives the `Activity` object.

### Response Handling (The "Sync" Loop)
1.  **Frontend Polls**: Validates `remote_task_id` and polls `GET /agent-tasks/{id}` every 2s.
2.  **Frontend Updates Backend (Planned)**:
    *   If remote status changes, Frontend calls `POST /activities/{id}/append` to log progress.
    *   If remote task completes, Frontend calls `POST /activities/{id}/end` to finalize the Activity Result.

### Trade-offs
*   **Pros**: Zero new infrastructure (no Redis/Celery required yet).
*   **Cons**: **Browser Dependency**. If the user closes the tab, the Activity Log stops updating. The remote agent completes its work, but our database never hears about it.

---

## Phase 2: Robust Backend Polling (Future)
**Goal**: Production-grade reliability using background workers.

### Architecture
*   **Tech Stack**: Celery (Worker) + Redis (Broker & Result Backend).

### Design
1.  **Trigger**:
    *   Refactor `assign_to_agent` endpoint.
    *   Instead of just returning, it also calls `activities.tasks.monitor_remote_agent.delay(activity_id, remote_task_id)`.
    *   This "Fire-and-Forget" call hands off responsibility to the worker.

2.  **Celery Task Logic (`monitor_remote_agent`)**:
    *   **Independent Execution**: Runs on the server, ensuring updates happen regardless of user presence.
    *   **The Loop**:
        ```python
        while True:
            status = get_remote_status(remote_task_id)
            
            if status.changed:
                activity_service.update_activity(activity_id, action=f"Status: {status}")
            
            if status.is_complete:
                activity_service.end_activity(activity_id, result=status.result)
                break
            
            time.sleep(5)  # Polling interval
        ```
    *   **Safety**:
        *   **Timeouts**: Enforce max runtime (e.g., 30 mins) to prevent "zombie" tasks.
        *   **Locking**: Use Redis locks if necessary to prevent duplicate monitors for the same task.

### Implementation Checklist
- [ ] Configure `celery_app` in backend.
- [ ] Set up Redis container in `docker-compose.yml`.
- [ ] Create `app/worker.py` and define `monitor_remote_agent`.
- [ ] Update `tasks.py` endpoint to trigger the Celery task.
