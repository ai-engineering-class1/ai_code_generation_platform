# Notification policy (implemented)

## Severity levels (L1–L4)

| Level | Meaning | In-app recipients (core) | Email |
|------|---------|----------------------------|-------|
| **1** | Info / success | Stakeholders only (e.g. assignee); GitHub PR/push/success → all active users | No |
| **2** | Warning / action | Stakeholders + **Manager** role; Ops if event is ops-tagged | Yes for urgent events (approvals, blocked task, etc.) |
| **3** | Failure | Stakeholders + **Manager** + **Ops** | Yes |
| **4** | Critical system | Managers + Ops + **System Admin** | Yes |

Role names match `roles.name`: `Manager`, `Ops`, `System Admin`.

## Email

SMTP is optional. Set in `.env`:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS` (default `true`)
- `NOTIFICATION_EMAIL_FROM`
- `APP_PUBLIC_URL` (prefix for relative `action_url` in emails)

If SMTP is not configured, failure/critical emails are **logged** only (in-app notifications still created).

## Code entry points

- **`dispatch_notification`** (`app/services/notification_dispatch.py`) — generic fan-out + email.
- **`notify_*`** in `app/services/notification_service.py` — task/workflow helpers using event codes.
- **`dispatch_system_alert`** — call with e.g. `system.queue_down`, `system.db_unavailable`.
- **Event registry** — `app/services/notification_events.py` (`EVENT_REGISTRY`, `L2_EMAIL_EVENTS`).

## Database

Run `python update_db_schema.py` to add `notifications.severity`, `event_code`, `email_sent`.
