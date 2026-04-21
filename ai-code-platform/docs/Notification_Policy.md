# Notification policy (implemented)

## Severity levels (L1–L4)

| Level | Meaning | In-app recipients (core) | Email |
|------|---------|----------------------------|-------|
| **1** | Info / success | Stakeholders (assignee, owner when routed); not broadcast to all users | Yes for allowlisted events (`L1_EMAIL_EVENTS`: e.g. task assigned/completed, PR merged, workflow completed) when SMTP is set |
| **2** | Warning / action | Stakeholders + **Manager** role; Ops if event is ops-tagged | Yes for urgent events (approvals, blocked task, etc.) |
| **3** | Failure | Stakeholders + **Manager** + **Ops** | Yes |
| **4** | Critical system | Managers + Ops + **System Admin** | Yes |

Role names match `roles.name`: `Manager`, `Ops`, `System Admin`.

## Email

SMTP is optional. Set in `.env`:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS` (default `true`)
- `SMTP_SSL` (default `false`) — set `true` for implicit TLS (e.g. port **465**); when `false`, STARTTLS is used after connect (e.g. port **587**)
- `NOTIFICATION_EMAIL_FROM`
- `APP_PUBLIC_URL` (prefix for relative `action_url` in emails)
Example:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=EmailName***@gmail.com
SMTP_PASSWORD=**** **** **** ****
SMTP_TLS=true
SMTP_SSL=false
NOTIFICATION_EMAIL_FROM=EmailName@gmail.com
APP_PUBLIC_URL=http://127.0.0.1:3012
If SMTP is not configured, outbound email is **skipped** (in-app notifications still created). Unconfigured SMTP is logged at debug/info in `email_service` for would-be sends.

## Code entry points

- **`dispatch_notification`** (`app/services/notification_dispatch.py`) — generic fan-out + email.
- **`notify_*`** in `app/services/notification_service.py` — task/workflow helpers using event codes.
- **`dispatch_system_alert`** — call with e.g. `system.queue_down`, `system.db_unavailable`.
- **Event registry** — `app/services/notification_events.py` (`EVENT_REGISTRY`, `L1_EMAIL_EVENTS`, `L2_EMAIL_EVENTS`).

## Database

Run `python update_db_schema.py` to add `notifications.severity`, `event_code`, `email_sent`.
