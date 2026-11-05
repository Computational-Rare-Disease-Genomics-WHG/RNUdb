"""Startup verifications and bootstrap helpers.

Ensures the platform can never be deployed in a lockout-inducing state
(e.g., `ADMIN_GITHUB_LOGINS` empty while the database has no users).
"""

import logging
import os

from rnudb_utils.database import update_user_role

logger = logging.getLogger(__name__)

# Sentinel for when ADMIN_GITHUB_LOGINS is completely absent from the environment
_ADMIN_LOGINS_UNSET = object()


def _get_raw_admin_logins_env() -> str | None:
    """Return the raw value of ADMIN_GITHUB_LOGINS, or ``None`` if unset."""
    return os.environ.get("ADMIN_GITHUB_LOGINS")


def _admin_logins_explicitly_empty() -> bool:
    """``ADMIN_GITHUB_LOGINS`` is set in the environment but resolves to empty.

    An unset variable means the operator hasn't configured it yet (likely dev
    or CI), so we warn but don't block.  An explicitly empty variable is a
    deliberate misconfiguration that would cause permanent lockout.
    """
    raw = _get_raw_admin_logins_env()
    if raw is None:
        return False  # not set → dev/CI
    return not any(u.strip() for u in raw.split(","))


def get_admin_logins() -> list[str]:
    """Parse ADMIN_GITHUB_LOGINS env var into a deduplicated list."""
    raw = _get_raw_admin_logins_env() or ""
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

    When ``ADMIN_GITHUB_LOGINS`` is completely unset we assume a dev/CI
    environment and only log a warning — the check only hard-blocks when the
    variable is **explicitly set to empty**, which is a clear misconfiguration.
    """
    if admin_logins is None:
        admin_logins = get_admin_logins()
        # Distinguish between unset (dev/CI — warn only) and explicitly empty
        is_explicitly_empty = _admin_logins_explicitly_empty()
    else:
        # Explicitly passed — caller decides, no env distinction needed
        is_explicitly_empty = len(admin_logins) == 0

    issues: list[str] = []

    if not admin_logins:
        if not is_explicitly_empty:
            logger.warning(
                "ADMIN_GITHUB_LOGINS is not set — first user will be created as "
                "'pending'. In production, set ADMIN_GITHUB_LOGINS to at least "
                "one GitHub username before starting the service."
            )
            return issues

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
                "ADMIN_GITHUB_LOGINS is explicitly empty AND the database has "
                "no users. The first user would be created as 'pending', making "
                "the platform permanently unrecoverable. Set "
                "ADMIN_GITHUB_LOGINS to at least one GitHub username before "
                "starting the service, then log in with that GitHub account "
                "to become an admin."
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
