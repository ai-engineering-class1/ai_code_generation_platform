"""
Optional SMTP delivery for notification emails.
If SMTP is not configured, logs the would-be email instead of failing the request.
"""
import logging
import time
import smtplib
from contextlib import contextmanager
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Generator, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.NOTIFICATION_EMAIL_FROM)


def smtp_is_configured() -> bool:
    """True when outbound SMTP env is set (same check as single-send helper)."""
    return _smtp_configured()


def _format_email_body(
    body_text: str,
    action_url: Optional[str],
    event_code: Optional[str],
) -> str:
    if action_url:
        body_text = f"{body_text}\n\nOpen: {action_url}\n"
    footer_lines = []
    if event_code:
        footer_lines.append(f"Event: {event_code}")
    if settings.APP_NAME:
        footer_lines.append(settings.APP_NAME)
    if footer_lines:
        body_text = f"{body_text.rstrip()}\n\n--\n" + "\n".join(footer_lines) + "\n"
    return body_text


def _make_connected_server() -> smtplib.SMTP:
    timeout = settings.SMTP_TIMEOUT_SECONDS
    if settings.SMTP_SSL:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
    else:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
        if settings.SMTP_TLS:
            server.starttls()
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    return server


@contextmanager
def smtp_session() -> Generator[smtplib.SMTP, None, None]:
    """
    One TCP connection + login. Retry connect once on transient errors.
    Caller must not use server after context exits.
    """
    transient = (TimeoutError, OSError, smtplib.SMTPServerDisconnected)
    server: Optional[smtplib.SMTP] = None
    for attempt in (1, 2):
        try:
            server = _make_connected_server()
            break
        except transient as e:
            if attempt == 2:
                logger.error("[EMAIL] SMTP connect failed after 2 attempts: %s", e)
                raise
            logger.warning("[EMAIL] SMTP connect failed (%s/2): %s; retrying", attempt, e)
            time.sleep(2)
    assert server is not None
    try:
        yield server
    finally:
        try:
            server.quit()
        except Exception:
            pass


def send_on_connected_server(
    server: smtplib.SMTP,
    to_email: str,
    subject: str,
    body_text: str,
    action_url: Optional[str] = None,
    event_code: Optional[str] = None,
) -> None:
    """Send one message on an existing authenticated SMTP session."""
    body = _format_email_body(body_text, action_url, event_code)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.NOTIFICATION_EMAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain", "utf-8"))
    server.sendmail(settings.NOTIFICATION_EMAIL_FROM, [to_email], msg.as_string())


def send_notification_email(
    to_email: str,
    subject: str,
    body_text: str,
    action_url: Optional[str] = None,
    event_code: Optional[str] = None,
) -> bool:
    """
    Send a plain-text email. Returns True if sent (or simulated as sent when SMTP off).
    """
    if not _smtp_configured():
        logger.info(
            "[EMAIL] SMTP not configured; skipping send (would send to %s): %s",
            to_email,
            subject[:80],
        )
        return False

    try:
        transient = (TimeoutError, OSError, smtplib.SMTPServerDisconnected)
        for attempt in (1, 2):
            try:
                with smtp_session() as server:
                    send_on_connected_server(
                        server, to_email, subject, body_text, action_url, event_code
                    )
                break
            except transient as e:
                if attempt == 2:
                    raise
                logger.warning(
                    "[EMAIL] transient error sending to %s (attempt %s/2): %s; retrying",
                    to_email,
                    attempt,
                    e,
                )
                time.sleep(2)
        logger.info("[EMAIL] Sent to %s: %s", to_email, subject[:80])
        return True
    except Exception as e:
        logger.error("[EMAIL] Failed to send to %s: %s", to_email, e, exc_info=True)
        return False
