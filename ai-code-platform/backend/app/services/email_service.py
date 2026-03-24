"""
Optional SMTP delivery for notification emails.
If SMTP is not configured, logs the would-be email instead of failing the request.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.NOTIFICATION_EMAIL_FROM)


def send_notification_email(
    to_email: str,
    subject: str,
    body_text: str,
    action_url: Optional[str] = None,
) -> bool:
    """
    Send a plain-text email. Returns True if sent (or simulated as sent when SMTP off).
    """
    if action_url:
        body_text = f"{body_text}\n\nOpen: {action_url}\n"

    if not _smtp_configured():
        logger.info(
            "[EMAIL] SMTP not configured; skipping send (would send to %s): %s",
            to_email,
            subject[:80],
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.NOTIFICATION_EMAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(body_text, "plain", "utf-8"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.NOTIFICATION_EMAIL_FROM, [to_email], msg.as_string())
        logger.info("[EMAIL] Sent to %s: %s", to_email, subject[:80])
        return True
    except Exception as e:
        logger.error("[EMAIL] Failed to send to %s: %s", to_email, e, exc_info=True)
        return False
