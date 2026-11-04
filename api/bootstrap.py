"""Startup verifications and bootstrap helpers.

Ensures the platform can never be deployed in a lockout-inducing state
(e.g., `ADMIN_GITHUB_LOGINS` empty while the database has no users).
"""

import logging
import os

from rnudb_utils.database import update_user_role

logger = logging.getLogger(__name__)


def get_admin_logins() -> list[str]:
    """Parse ADMIN_GITHUB_LOGINS env var into a deduplicated list."""
    raw = os.environ.get("ADMIN_GITHUB_LOGINS", "")
    seen: set[str] = set()
    result: list[str] = []
    for u in raw.split(","):
        s = u.strip().lower()
        if s and s not in seen:
            seen.add(s)
            result.append(s)
    return result


def check_bootstrap_config(admin_logins: list[str] | None = None) -> list[str]:
    """Return a list of configuration warnings/errors.

    Call at startup (not import-time) so it can safely query the database.
    Returns a list of issue strings (empty = all good).
    """
    if admin_logins is None:
        admin_logins = get_admin_logins()

    issues: list[str] = []

    if not admin_logins:
        try:
            from sqlalchemy import text

            from rnudb_utils.database import SessionLocal

            with SessionLocal() as db:
                count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        except Exception:
            # Database not yet migrated — skip check
            return issues

        if count == 0:
            issues.append(
                "ADMIN_GITHUB_LOGINS is empty/unset AND the database has no users. "
                "The first user would be created as 'pending', making the platform "
                "permanently unrecoverable. Set ADMIN_GITHUB_LOGINS to at least one "
                "GitHub username before starting the service, then log in with that "
                "GitHub account to become an admin."
            )

    return issues


def promote_to_admin(github_login: str) -> bool:
    """Promote a user to admin (one-shot recovery script)."""
    from rnudb_utils.database import get_user

    user = get_user(github_login)
    if user is None:
        logger.warning("User %s not found — cannot promote", github_login)
        return False
    update_user_role(github_login, "admin")
    logger.info("User %s promoted to admin", github_login)
    return True
