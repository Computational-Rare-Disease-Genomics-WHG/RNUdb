"""Tests for auth-related environment configuration."""

import pytest

from api import config


def test_require_jwt_secret_key_fails_when_missing(monkeypatch):
    """JWT secret must be configured."""
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    with pytest.raises(
        RuntimeError, match="JWT_SECRET_KEY environment variable is required"
    ):
        config.require_jwt_secret_key()


def test_require_jwt_secret_key_returns_value_when_present(monkeypatch):
    """JWT secret is returned unchanged when configured."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret-key")

    assert config.require_jwt_secret_key() == "test-jwt-secret-key"
