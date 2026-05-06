"""Slack webhook notifications for approvals."""

import logging
import os
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

SLACK_ENABLED = os.environ.get("SLACK_ENABLED", "false").lower() == "true"
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")
SLACK_DEFAULT_CHANNEL = os.environ.get("SLACK_DEFAULT_CHANNEL", "#general")


def _send_webhook(message: str) -> bool:
    """Send message to Slack webhook. Returns True on success, False on failure."""
    if not SLACK_ENABLED or not SLACK_WEBHOOK_URL:
        return False

    try:
        payload = {
            "text": message,
            "channel": SLACK_DEFAULT_CHANNEL,
        }
        with httpx.Client(timeout=10) as client:
            response = client.post(SLACK_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return True
    except Exception as e:
        logger.warning(f"Failed to send Slack notification: {e}")
        return False


def notify_user_approved(github_login: str, approved_by: str) -> bool:
    """Notify when a user is approved."""
    message = (
        f"🔔 User Approved\n• @{github_login} promoted to curator\n"
        f"• By: @{approved_by}"
    )
    return _send_webhook(message)


def notify_change_approved(
    entity_type: str,
    action: str,
    requested_by: str,
    approved_by: str,
) -> bool:
    """Notify when a data change is approved."""
    message = f"📝 Change Approved\n• {entity_type} - {action}\n• By: @{approved_by}"
    return _send_webhook(message)


def notify_change_rejected(
    entity_type: str,
    action: str,
    requested_by: str,
    rejected_by: str,
    reason: str | None = None,
) -> bool:
    """Notify when a data change is rejected."""
    reason_text = f"\n• Reason: {reason}" if reason else ""
    msg = (
        f"📝 Change Rejected\n• {entity_type} - {action}\n"
        f"• By: @{rejected_by}{reason_text}"
    )
    return _send_webhook(msg)


def notify_test() -> bool:
    """Send a test notification."""
    message = (
        f"🧪 Test Notification\n"
        f"• RNUdb Slack integration is working!\n"
        f"• Time: {datetime.now().isoformat()}"
    )
    return _send_webhook(message)


def is_enabled() -> bool:
    """Check if Slack notifications are enabled."""
    return SLACK_ENABLED and bool(SLACK_WEBHOOK_URL)
