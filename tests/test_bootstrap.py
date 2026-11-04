"""Tests for bootstrap config checks and admin recovery (#315).

Note: SessionLocal is imported inside each test on purpose — the conftest
`test_engine` fixture swaps `rnudb_utils.database.SessionLocal` to a temp DB,
and a module-level import would bind to the original (production) sessionmaker.
"""

from sqlalchemy import text

from api.bootstrap import (
    check_bootstrap_config,
    get_admin_logins,
    promote_to_admin,
)


def _seed_user(login: str, role: str) -> None:
    from rnudb_utils.database import SessionLocal

    with SessionLocal() as db:
        db.execute(
            text(
                "INSERT INTO users (github_login, name, email, role)"
                " VALUES (:l, :n, :e, :r)"
            ),
            {"l": login, "n": login, "e": f"{login}@ex.com", "r": role},
        )
        db.commit()


class TestGetAdminLogins:
    def test_parses_and_dedupes(self, monkeypatch):
        monkeypatch.setenv("ADMIN_GITHUB_LOGINS", "Alice, bob, ALICE , ")
        assert get_admin_logins() == ["alice", "bob"]

    def test_empty(self, monkeypatch):
        monkeypatch.delenv("ADMIN_GITHUB_LOGINS", raising=False)
        assert get_admin_logins() == []


class TestCheckBootstrapConfig:
    def test_empty_db_and_no_admins_is_blocked(self, test_engine):
        issues = check_bootstrap_config(admin_logins=[])
        assert len(issues) == 1
        assert "ADMIN_GITHUB_LOGINS" in issues[0]

    def test_admins_configured_passes(self, test_engine):
        issues = check_bootstrap_config(admin_logins=["elstondsouza"])
        assert issues == []

    def test_existing_user_unblocks(self, test_engine):
        _seed_user("bs_existing", "curator")
        issues = check_bootstrap_config(admin_logins=[])
        assert issues == []


class TestPromoteToAdmin:
    def test_promotes_existing_user(self, test_engine):
        _seed_user("bs_lockout", "pending")
        assert promote_to_admin("bs_lockout") is True

        from rnudb_utils.database import SessionLocal

        with SessionLocal() as db:
            role = db.execute(
                text("SELECT role FROM users WHERE github_login='bs_lockout'")
            ).scalar()
        assert role == "admin"

    def test_unknown_user_returns_false(self, test_engine):
        assert promote_to_admin("bs_does_not_exist") is False
