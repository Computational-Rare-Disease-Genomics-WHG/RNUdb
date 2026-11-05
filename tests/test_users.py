"""Tests for user approve/reject endpoints (#319)."""

import json
from datetime import datetime

from sqlalchemy import text


def _as_dict(value):
    return json.loads(value) if isinstance(value, str) else value


def _seed_user(db, login: str, role: str):
    # created_at/updated_at are set like a real GitHub-signup user so the
    # approve/reject audit path must serialize datetimes (regression for #354).
    db.execute(
        text(
            "INSERT INTO users"
            " (github_login, name, email, avatar_url, role, created_at, updated_at)"
            " VALUES (:login, :name, :email, NULL, :role, :created_at, :updated_at)"
        ),
        {
            "login": login,
            "name": f"User {login}",
            "email": f"{login}@test.local",
            "role": role,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    )
    db.commit()


class TestUserApproveReject:
    """Approve/reject must validate existence, state, and audit."""

    def test_approve_nonexistent_user_404(self, test_client, test_db):
        resp = test_client.post("/api/users/nobody/approve")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_reject_nonexistent_user_404(self, test_client, test_db):
        resp = test_client.post("/api/users/nobody/reject")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_approve_pending_user(self, test_client, test_db):
        _seed_user(test_db, "alice", "pending")
        resp = test_client.post("/api/users/alice/approve")
        assert resp.status_code == 200

        row = test_db.execute(
            text("SELECT role FROM users WHERE github_login='alice'")
        ).fetchone()
        assert row._mapping["role"] == "curator"

        # Role change is audited
        audit = test_db.execute(
            text(
                "SELECT table_name, record_id, action, user_login, new_values"
                " FROM audit_log WHERE record_id='alice' ORDER BY id DESC LIMIT 1"
            )
        ).fetchone()
        assert audit._mapping["table_name"] == "users"
        assert audit._mapping["action"] == "UPDATE"
        assert audit._mapping["user_login"] == "test_admin"
        assert _as_dict(audit._mapping["new_values"])["role"] == "curator"

    def test_approve_already_curator_409(self, test_client, test_db):
        _seed_user(test_db, "bob", "curator")
        resp = test_client.post("/api/users/bob/approve")
        assert resp.status_code == 409

    def test_reject_existing_user(self, test_client, test_db):
        _seed_user(test_db, "carol", "pending")
        resp = test_client.post("/api/users/carol/reject")
        assert resp.status_code == 200

        row = test_db.execute(
            text("SELECT role FROM users WHERE github_login='carol'")
        ).fetchone()
        assert row._mapping["role"] == "guest"

        audit = test_db.execute(
            text(
                "SELECT table_name, action, user_login FROM audit_log"
                " WHERE record_id='carol' ORDER BY id DESC LIMIT 1"
            )
        ).fetchone()
        assert audit._mapping["table_name"] == "users"
        assert audit._mapping["action"] == "UPDATE"

    def test_reject_already_guest_409(self, test_client, test_db):
        _seed_user(test_db, "dave", "guest")
        resp = test_client.post("/api/users/dave/reject")
        assert resp.status_code == 409

    def test_admin_cannot_be_rejected(self, test_client, test_db):
        _seed_user(test_db, "root", "admin")
        resp = test_client.post("/api/users/root/reject")
        assert resp.status_code == 409
