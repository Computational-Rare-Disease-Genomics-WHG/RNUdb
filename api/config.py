"""Application configuration helpers."""

import os


def require_jwt_secret_key() -> str:
    """Return configured JWT secret key or raise a startup error."""
    secret = os.environ.get("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable is required; refusing to start "
            "without a configured JWT signing secret."
        )
    return secret


JWT_SECRET_KEY = require_jwt_secret_key()
