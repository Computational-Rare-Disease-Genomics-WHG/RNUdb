"""Admin utilities router."""

from fastapi import APIRouter, Depends

from api.notifications import is_enabled, notify_test
from api.routers.auth import require_admin

router = APIRouter(prefix="/admin")


@router.get("/slack/status")
async def get_slack_status(user: dict = Depends(require_admin)) -> dict:
    """Get Slack integration status."""
    return {"enabled": is_enabled()}


@router.post("/slack/test")
async def test_slack_notification(user: dict = Depends(require_admin)) -> dict:
    """Send a test Slack notification."""
    success = notify_test()
    return {"success": success, "message": "Test notification sent" if success else "Slack not configured"}