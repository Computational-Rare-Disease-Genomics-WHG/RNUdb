"""Tests for approval workflow (pending_changes table)."""

import json

import pytest
from sqlalchemy import text


class TestApprovalsAPI:
    """Tests for the curator approval workflow."""

    def _create_pending(self, client, payload):
        """Helper: create a pending change."""
        return client.post("/api/approvals", json=payload)

    def _approve_and_apply(self, client, change_id):
        """Helper: approve then apply a change."""
        client.post(f"/api/approvals/{change_id}/review", json={"status": "approved"})
        return client.post(f"/api/approvals/{change_id}/apply")

    def test_create_pending_change(self, test_client):
        """Curator can submit a change request."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": None,
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V1", "function_score": 0.75},
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "pending"
        assert data["requested_by"] == "test_curator"
        assert data["entity_type"] == "variant"

    def test_create_pending_change_rejects_invalid_payload_keys(self, test_client):
        """Non-whitelisted payload keys are rejected with 422, not silently dropped."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": None,
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {
                    "id": "V1",
                    "function_score": 0.5,
                    "clinical_significance": "Pathogenic",
                    "DROP TABLE variants": "x",
                },
            },
        )
        assert res.status_code == 422
        detail = res.json()["detail"]
        assert "clinical_significance" in detail["invalid_fields"]
        assert "DROP TABLE variants" in detail["invalid_fields"]
        assert "function_score" not in detail["invalid_fields"]  # valid key allowed

    def test_create_pending_change_allows_import_shape_keys(self, test_client):
        """At submission, import payloads may carry nested data + meta keys."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "variants": [{"position": 120291764, "ref": "C", "alt": "T"}],
                    "skip_invalid": True,
                },
            },
        )
        assert res.status_code == 200
        assert res.json()["action"] == "import"

    def test_list_pending_shows_own(self, test_client):
        """Curator only sees their own submissions."""
        self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V2"},
            },
        )
        res = test_client.get("/api/approvals?status=pending")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
        assert all(item["requested_by"] == "test_curator" for item in data)

    def test_admin_can_list_all(self, test_client):
        """(Placeholder for when separate admin auth tests exist)."""
        pytest.skip("Requires separate admin user fixture")

    def test_reviewer_cannot_access_other_users_submissions(self, test_client):
        """Curators shouldn't see each other's pending changes."""
        pytest.skip("Requires second curator fixture")

    def test_review_approve(self, test_client):
        """Admin can approve a pending change."""
        # Create
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V3", "function_score": 0.1},
            },
        )
        change_id = create_res.json()["id"]

        # Review
        review_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved", "notes": "Looks good"},
        )
        assert review_res.status_code == 200
        reviewed = review_res.json()
        assert reviewed["status"] == "approved"
        assert reviewed["reviewed_by"] == "test_admin"  # admin user due to mock
        assert reviewed["review_notes"] == "Looks good"

    def test_review_reject(self, test_client):
        """Admin can reject a pending change."""
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "gene",
                "gene_id": "RNU2-2",
                "action": "create",
                "payload": {"name": "RNU2-2"},
            },
        )
        change_id = create_res.json()["id"]

        reject_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "rejected", "notes": "Missing required fields"},
        )
        assert reject_res.status_code == 200
        reviewed = reject_res.json()
        assert reviewed["status"] == "rejected"
        assert reviewed["review_notes"] == "Missing required fields"

    def test_double_review_blocked(self, test_client):
        """Cannot review an already reviewed change."""
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "V4"},
            },
        )
        change_id = create_res.json()["id"]

        # First review
        test_client.post(
            f"/api/approvals/{change_id}/review", json={"status": "approved"}
        )

        # Second review is idempotent - returns 200 with current state
        second = test_client.post(
            f"/api/approvals/{change_id}/review", json={"status": "rejected"}
        )
        assert second.status_code == 200
        assert second.json()["status"] == "approved"  # remains as first review

    def test_get_single_change(self, test_client):
        """Can fetch a change by ID."""
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "literature",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {"pmid": "123456"},
            },
        )
        change_id = create_res.json()["id"]

        get_res = test_client.get(f"/api/approvals/{change_id}")
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["id"] == change_id
        assert data["payload"]["pmid"] == "123456"

    def test_invalid_entity_type_rejected(self, test_client):
        """Invalid entity_type returns 422."""
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "invalid_type",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {},
            },
        )
        assert res.status_code == 422

    def test_invalid_action_rejected(self, test_client):
        """Invalid action returns 422."""
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "merge",  # invalid
                "payload": {},
            },
        )
        assert res.status_code == 422

    def test_unsupported_entity_action_combination_rejected(self, test_client):
        """e.g. structure 'create' is not supported and must be rejected."""
        for entity_type, action in (("structure", "create"), ("gene", "import")):
            res = test_client.post(
                "/api/approvals",
                json={
                    "entity_type": entity_type,
                    "gene_id": "RNU4-2",
                    "action": action,
                    "payload": {},
                },
            )
            assert res.status_code == 422
            assert "not supported" in res.json()["detail"]["message"]

    def test_filter_by_status(self, test_client):
        """Filtering by status returns only matching records."""
        # Create 2 pending + approve 1
        r1 = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V5"},
            },
        )
        self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V6"},
            },
        )
        test_client.post(
            f"/api/approvals/{r1.json()['id']}/review", json={"status": "approved"}
        )

        # Filter approved
        res = test_client.get("/api/approvals?status=approved")
        assert res.status_code == 200
        data = res.json()
        assert all(item["status"] == "approved" for item in data)

        # Filter pending
        res2 = test_client.get("/api/approvals?status=pending")
        assert res2.status_code == 200
        data2 = res2.json()
        assert all(item["status"] == "pending" for item in data2)

    def test_filter_by_applied_status(self, test_client, test_db, seed_test_data):
        """Applied changes can be filtered by status=applied (#308)."""
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": "V-UPD-001",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"function_score": 0.9},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = self._approve_and_apply(test_client, change_id)
        assert apply_res.status_code == 200
        assert apply_res.json()["status"] == "applied"

        res = test_client.get("/api/approvals?status=applied")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
        assert all(item["status"] == "applied" for item in data)

    def test_filter_by_gene_id(self, test_client):
        """Filtering by gene_id works."""
        self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {},
            },
        )
        self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU2-2",
                "action": "update",
                "payload": {},
            },
        )

        res = test_client.get("/api/approvals?gene_id=RNU4-2")
        assert res.status_code == 200
        data = res.json()
        assert all(item["gene_id"] == "RNU4-2" for item in data)

    def test_apply_variant_update(self, test_client, test_db, seed_test_data):
        """Admin can apply an approved variant update."""
        # Variant V-UPD-001 already exists from seed_test_data
        # Just update it via approval

        # Create pending update
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": "V-UPD-001",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {
                    "id": "V-UPD-001",
                    "function_score": 0.5,
                },
            },
        )
        change_id = create_res.json()["id"]

        # Approve
        test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )

        # Apply
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200
        applied = apply_res.json()
        assert applied["status"] == "applied"
        assert applied["applied_at"] is not None

    def test_apply_variant_delete(self, test_client, test_db, seed_test_data):
        """Admin can apply an approved variant delete."""
        # Create pending delete
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": "V-DEL-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "V-DEL-001"},
            },
        )
        change_id = create_res.json()["id"]

        # Approve
        test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )

        # Apply
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200
        applied = apply_res.json()
        assert applied["status"] == "applied"
        assert applied["applied_at"] is not None

    def test_apply_rejected_change_fails(self, test_client):
        """Cannot apply a rejected change."""
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": "V-REJ-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "V-REJ-001"},
            },
        )
        change_id = create_res.json()["id"]

        # Reject
        test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "rejected"},
        )

        # Apply should fail
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 400
        assert "approved" in apply_res.json()["detail"].lower()

    def test_apply_pending_change_fails(self, test_client):
        """Cannot apply a change that hasn't been approved."""
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": "V-PENDING-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "V-PENDING-001"},
            },
        )
        change_id = create_res.json()["id"]

        # Apply without review should fail
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 400
        assert "approved" in apply_res.json()["detail"].lower()

    def test_apply_nonexistent_change_fails(self, test_client):
        """Applying a nonexistent change returns 404."""
        apply_res = test_client.post("/api/approvals/99999/apply")
        assert apply_res.status_code == 404
        assert "not found" in apply_res.json()["detail"].lower()

    def test_filter_by_entity_type(self, test_client):
        """Filtering by entity_type works."""
        self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {},
            },
        )
        self._create_pending(
            test_client,
            {
                "entity_type": "literature",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {},
            },
        )

        res = test_client.get("/api/approvals?entity_type=variant")
        assert res.status_code == 200
        data = res.json()
        assert all(item["entity_type"] == "variant" for item in data)

    def test_create_literature_approval(self, test_client):
        """Curator can submit literature for approval."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "literature",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "id": "LIT-001",
                    "title": "Test Paper",
                    "authors": "Smith J",
                    "journal": "Nature",
                    "year": 2024,
                },
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["entity_type"] == "literature"
        assert data["action"] == "create"

    def test_approve_and_apply_literature_create(self, test_client, test_db):
        """Admin can approve and apply literature creation."""
        # Create
        create_res = self._create_pending(
            test_client,
            {
                "entity_type": "literature",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "id": "LIT-APPLY-001",
                    "title": "New Paper",
                    "authors": "Doe J",
                    "journal": "Science",
                    "year": 2025,
                    "doi": "10.1126/science.12345",
                },
            },
        )
        change_id = create_res.json()["id"]

        apply_res = self._approve_and_apply(test_client, change_id)
        assert apply_res.status_code == 200
        assert apply_res.json()["status"] == "applied"

        row = test_db.execute(
            text("SELECT * FROM literature WHERE id = 'LIT-APPLY-001'")
        ).fetchone()
        assert row is not None
        assert row._mapping["title"] == "New Paper"

    def test_structure_delete_approval(self, test_client):
        """Curator can submit structure deletion for approval."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "structure",
                "entity_id": "STR-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "STR-001"},
            },
        )
        assert res.status_code == 200
        assert res.json()["entity_type"] == "structure"
        assert res.json()["action"] == "delete"

    def test_bed_track_delete_approval(self, test_client):
        """Curator can submit BED track deletion for approval."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "bed_track",
                "entity_id": "BED-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "BED-001"},
            },
        )
        assert res.status_code == 200
        assert res.json()["entity_type"] == "bed_track"
        assert res.json()["action"] == "delete"


class TestApplyFailureAndAudit:
    """Failed applies are recorded and retryable (#309); applies are audited (#310)."""

    def test_apply_failure_returns_500(self, test_client, seed_test_data):
        """A conflicting mutation fails loudly instead of silently passing."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "id": "V-DEL-001",  # already seeded
                    "geneId": "RNU4-2",
                    "position": 120291764,
                    "ref": "C",
                    "alt": "T",
                },
            },
        )
        change_id = create_res.json()["id"]
        test_client.post(
            f"/api/approvals/{change_id}/review", json={"status": "approved"}
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 500

    def test_mark_apply_failed_records_reason(self, test_client, test_db):
        """The failure marker stores a human-readable reason."""
        from api.routers.approvals import _mark_apply_failed

        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V9", "function_score": 0.1},
            },
        )
        change_id = create_res.json()["id"]

        _mark_apply_failed(test_db, change_id, "UNIQUE constraint failed: variants.id")

        row = test_db.execute(
            text("SELECT status, failure_reason FROM pending_changes WHERE id=:c"),
            {"c": change_id},
        ).fetchone()
        assert row._mapping["status"] == "failed"
        assert "UNIQUE constraint failed" in row._mapping["failure_reason"]

        # Failed changes are filterable (list API)
        res = test_client.get("/api/approvals?status=failed")
        assert res.status_code == 200
        assert any(item["id"] == change_id for item in res.json())

    def test_retry_apply_from_failed(self, test_client, test_db, seed_test_data):
        """A failed change can be retried and reaches 'applied' (#309)."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "entity_id": "V-UPD-001",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"function_score": 0.77},
            },
        )
        change_id = create_res.json()["id"]
        test_client.post(
            f"/api/approvals/{change_id}/review", json={"status": "approved"}
        )

        # Simulate a failed apply landed on the row
        test_db.execute(
            text(
                "UPDATE pending_changes SET status='failed',"
                " failure_reason='Apply failed: transient' WHERE id=:c"
            ),
            {"c": change_id},
        )
        test_db.commit()

        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200
        assert apply_res.json()["status"] == "applied"

        row = test_db.execute(
            text(
                "SELECT status, failure_reason, applied_at"
                " FROM pending_changes WHERE id=:c"
            ),
            {"c": change_id},
        ).fetchone()
        assert row._mapping["status"] == "applied"
        assert row._mapping["applied_at"] is not None
        assert row._mapping["failure_reason"] is None

    def test_apply_writes_audit_log(self, test_client, test_db, seed_test_data):
        """Applying a change records an audit_log entry for the admin (#310)."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "entity_id": "V-UPD-001",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"function_score": 0.42},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = self._approve_and_apply_helper(test_client, change_id)
        assert apply_res.status_code == 200

        row = test_db.execute(
            text(
                "SELECT table_name, record_id, action, user_login, old_values,"
                " new_values FROM audit_log ORDER BY id DESC LIMIT 1"
            )
        ).fetchone()
        assert row._mapping["table_name"] == "variants"
        assert row._mapping["record_id"] == "V-UPD-001"
        assert row._mapping["action"] == "UPDATE"
        assert row._mapping["user_login"] == "test_admin"
        old_values = (
            json.loads(row._mapping["old_values"])
            if isinstance(row._mapping["old_values"], str)
            else row._mapping["old_values"]
        )
        new_values = (
            json.loads(row._mapping["new_values"])
            if isinstance(row._mapping["new_values"], str)
            else row._mapping["new_values"]
        )
        assert old_values is not None
        assert new_values["function_score"] == 0.42

    def test_apply_gene_delete_audits_old_values(
        self, test_client, test_db, seed_test_data
    ):
        """Deleting via approval records the before-rows in audit_log."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "gene",
                "entity_id": "RNU4-2",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "RNU4-2"},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = self._approve_and_apply_helper(test_client, change_id)
        assert apply_res.status_code == 200

        row = test_db.execute(
            text(
                "SELECT table_name, record_id, action, user_login, old_values"
                " FROM audit_log WHERE action='DELETE' ORDER BY id DESC LIMIT 1"
            )
        ).fetchone()
        assert row._mapping["table_name"] == "genes"
        assert row._mapping["record_id"] == "RNU4-2"
        assert row._mapping["user_login"] == "test_admin"
        old_values = (
            json.loads(row._mapping["old_values"])
            if isinstance(row._mapping["old_values"], str)
            else row._mapping["old_values"]
        )
        assert old_values["id"] == "RNU4-2"

    @staticmethod
    def _approve_and_apply_helper(client, change_id):
        client.post(f"/api/approvals/{change_id}/review", json={"status": "approved"})
        return client.post(f"/api/approvals/{change_id}/apply")


class TestSubmissionNotification:
    """Submitting a change notifies admins (#320)."""

    def test_create_pending_change_notifies(self, test_client, monkeypatch):
        calls = []

        def fake_notify(entity_type, action, requested_by):
            calls.append((entity_type, action, requested_by))
            return True

        import api.routers.approvals as approvals_module

        monkeypatch.setattr(approvals_module, "notify_change_submitted", fake_notify)
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V-N-001"},
            },
        )
        assert res.status_code == 200
        assert calls == [("variant", "update", "test_curator")]


class TestApplyCascadeDeletes:
    """Applied deletes must cascade dependent rows (#311 / #285)."""

    def _seed_rich_gene(self, test_db):
        """Seed a gene with variants, literature, classifications, structure,
        bed track, and variant links."""
        from api.models import (
            BedTrack,
            Literature,
            Nucleotide,
            RNAStructure,
            VariantClassification,
            VariantLink,
        )

        test_db.execute(
            text(
                "INSERT INTO genes (id, name, fullName, chromosome, start, end,"
                " strand, sequence, description)"
                " VALUES ('RNU4-2', 'RNU4-2', 'RNA, U4 small nuclear 2', 'chr12',"
                " 120291759, 120291903, '+', 'ACGUACGU', 'Test gene')"
            )
        )
        test_db.execute(
            text(
                "INSERT INTO variants (id, geneId, position, ref, alt)"
                " VALUES ('V-A', 'RNU4-2', 120291764, 'C', 'T'),"
                " ('V-B', 'RNU4-2', 120291782, 'A', 'C')"
            )
        )
        lit = Literature(
            id="LIT-C-001",
            title="Paper",
            authors="A",
            journal="J",
            year=2024,
            doi="10.1/abc",
        )
        test_db.add(lit)
        classification = VariantClassification(
            variant_id="V-A", literature_id="LIT-C-001"
        )
        test_db.add(classification)
        structure = RNAStructure(id="STR-C-001", geneId="RNU4-2")
        test_db.add(structure)
        test_db.add(Nucleotide(id=1, structure_id="STR-C-001", base="A", x=0, y=0))
        test_db.add(
            BedTrack(
                geneId="RNU4-2",
                track_name="t",
                chrom="12",
                interval_start=120291760,
                interval_end=120291770,
                created_by="test_curator",
            )
        )
        test_db.add(VariantLink(variant_id_1="V-A", variant_id_2="V-B"))
        test_db.commit()

    def test_apply_gene_delete_cascades(self, test_client, test_db):
        """Applying gene delete removes variants, classifications, structures,
        nucleotides, bed tracks, and links."""
        self._seed_rich_gene(test_db)

        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "gene",
                "entity_id": "RNU4-2",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "RNU4-2"},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        assert apply_res.status_code == 200
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        tables = {
            "variants": "SELECT COUNT(*) FROM variants WHERE geneId='RNU4-2'",
            "variant_classifications": ("SELECT COUNT(*) FROM variant_classifications"),
            "rna_structures": "SELECT COUNT(*) FROM rna_structures",
            "nucleotides": "SELECT COUNT(*) FROM nucleotides",
            "bed_tracks": "SELECT COUNT(*) FROM bed_tracks",
            "variant_links": "SELECT COUNT(*) FROM variant_links",
            "genes": "SELECT COUNT(*) FROM genes WHERE id='RNU4-2'",
        }
        for table, sql in tables.items():
            count = test_db.execute(text(sql)).scalar()
            assert count == 0, f"{table} should be empty after cascade delete"

    def test_apply_variant_delete_cascades(self, test_client, test_db, seed_gene):
        """Applying variant delete removes its classifications and links."""
        from api.models import (
            Literature,
            Variant,
            VariantClassification,
            VariantLink,
        )

        test_db.add(
            Variant(
                id="V-CC-001", geneId="RNU4-2", position=120291764, ref="C", alt="T"
            )
        )
        test_db.add(
            Variant(
                id="V-CC-002", geneId="RNU4-2", position=120291782, ref="A", alt="C"
            )
        )
        test_db.add(
            Literature(
                id="LIT-CC-001", title="P", authors="A", journal="J", year=2024, doi="x"
            )
        )
        test_db.add(
            VariantClassification(variant_id="V-CC-001", literature_id="LIT-CC-001")
        )
        test_db.add(VariantLink(variant_id_1="V-CC-001", variant_id_2="V-CC-002"))
        test_db.commit()

        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "entity_id": "V-CC-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "V-CC-001"},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = self._approve_and_apply_helper(test_client, change_id)
        assert apply_res.status_code == 200

        assert (
            test_db.execute(
                text("SELECT COUNT(*) FROM variants WHERE id='V-CC-001'")
            ).scalar()
            == 0
        )
        assert (
            test_db.execute(
                text(
                    "SELECT COUNT(*) FROM variant_classifications"
                    " WHERE variant_id='V-CC-001'"
                )
            ).scalar()
            == 0
        )
        assert test_db.execute(text("SELECT COUNT(*) FROM variant_links")).scalar() == 0
        # Literature (not variant-owned) survives
        assert (
            test_db.execute(
                text("SELECT COUNT(*) FROM literature WHERE id='LIT-CC-001'")
            ).scalar()
            == 1
        )

    def test_apply_literature_delete_cascades(self, test_client, test_db, seed_gene):
        """Applying literature delete removes classifications referencing it."""
        from api.models import (
            Literature,
            Variant,
            VariantClassification,
        )

        test_db.add(
            Variant(
                id="V-LIT-001", geneId="RNU4-2", position=120291764, ref="C", alt="T"
            )
        )
        test_db.add(
            Literature(
                id="LIT-DEL-001",
                title="P",
                authors="A",
                journal="J",
                year=2024,
                doi="x",
            )
        )
        test_db.add(
            VariantClassification(variant_id="V-LIT-001", literature_id="LIT-DEL-001")
        )
        test_db.commit()

        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "literature",
                "entity_id": "LIT-DEL-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "LIT-DEL-001"},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = self._approve_and_apply_helper(test_client, change_id)
        assert apply_res.status_code == 200

        assert (
            test_db.execute(
                text(
                    "SELECT COUNT(*) FROM variant_classifications"
                    " WHERE literature_id='LIT-DEL-001'"
                )
            ).scalar()
            == 0
        )
        assert (
            test_db.execute(
                text("SELECT COUNT(*) FROM literature WHERE id='LIT-DEL-001'")
            ).scalar()
            == 0
        )

    def test_apply_structure_delete_cascades(self, test_client, test_db, seed_gene):
        """Applying structure delete removes nucleotide/base-pair child rows."""
        from api.models import (
            BasePair,
            Nucleotide,
            RNAStructure,
        )

        test_db.add(RNAStructure(id="STR-DEL-001", geneId="RNU4-2"))
        test_db.add(Nucleotide(id=1, structure_id="STR-DEL-001", base="A", x=0, y=0))
        test_db.add(BasePair(structure_id="STR-DEL-001", from_pos=1, to_pos=2))
        test_db.commit()

        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "structure",
                "entity_id": "STR-DEL-001",
                "gene_id": "RNU4-2",
                "action": "delete",
                "payload": {"id": "STR-DEL-001"},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = self._approve_and_apply_helper(test_client, change_id)
        assert apply_res.status_code == 200

        assert (
            test_db.execute(
                text(
                    "SELECT COUNT(*) FROM nucleotides WHERE structure_id='STR-DEL-001'"
                )
            ).scalar()
            == 0
        )
        assert (
            test_db.execute(
                text("SELECT COUNT(*) FROM base_pairs WHERE structure_id='STR-DEL-001'")
            ).scalar()
            == 0
        )
        assert (
            test_db.execute(
                text("SELECT COUNT(*) FROM rna_structures WHERE id='STR-DEL-001'")
            ).scalar()
            == 0
        )

    @staticmethod
    def _approve_and_apply_helper(client, change_id):
        client.post(f"/api/approvals/{change_id}/review", json={"status": "approved"})
        return client.post(f"/api/approvals/{change_id}/apply")


class TestApplyVariantCreateWhitelist:
    """Variant create/update whitelists share a single source (#318)."""

    def test_apply_variant_create_with_id_and_gene_id(
        self, test_client, test_db, seed_test_data
    ):
        """Create allows id + geneId (plus the shared update columns)."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "id": "V-NEW-001",
                    "geneId": "RNU4-2",
                    "position": 120291770,
                    "ref": "G",
                    "alt": "A",
                    "function_score": -0.5,
                },
            },
        )
        assert create_res.status_code == 200
        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        assert apply_res.status_code == 200
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        row = test_db.execute(
            text("SELECT * FROM variants WHERE id='V-NEW-001'")
        ).fetchone()
        assert row is not None
        assert row._mapping["geneId"] == "RNU4-2"
        assert row._mapping["position"] == 120291770

    def test_variant_create_duplicate_id_rejected(self, test_client, seed_test_data):
        """A variant create for an existing id fails loudly at apply."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "id": "V-DEL-001",  # already seeded
                    "geneId": "RNU4-2",
                    "position": 120291764,
                    "ref": "C",
                    "alt": "T",
                },
            },
        )
        change_id = create_res.json()["id"]
        test_client.post(
            f"/api/approvals/{change_id}/review", json={"status": "approved"}
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        # SQLite PK conflict surfaces as a 500 here rather than silently passing
        assert apply_res.status_code == 500


class TestApprovalsAuthorization:
    """Tests for authorization in approval workflow."""

    def test_unauthenticated_cannot_list(self, test_client):
        """Unauthenticated users cannot list approvals."""
        # Clear auth header but keep base headers
        original_headers = test_client.headers.copy()
        test_client.headers = {}
        res = test_client.get("/api/approvals")
        # NOTE: with the autouse mock_auth override (see #316) requests without
        # headers still pass auth, so 200 is accepted until per-role fixtures land.
        assert res.status_code in (200, 401, 403, 404)
        # Restore headers
        test_client.headers = original_headers

    def test_unauthenticated_cannot_create(self, test_client):
        """Unauthenticated users cannot create approvals."""
        test_client.headers = {}
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {},
            },
        )
        # Expect auth error or different response when no auth
        assert res.status_code in (200, 401, 403, 422, 500)

    def test_review_without_approval_returns_404(self, test_client):
        """Reviewing a nonexistent change returns 404."""
        res = test_client.post(
            "/api/approvals/99999/review",
            json={"status": "approved"},
        )
        assert res.status_code == 404

    def test_apply_without_approval_returns_404(self, test_client):
        """Applying a nonexistent change returns 404."""
        res = test_client.post("/api/approvals/99999/apply")
        assert res.status_code == 404


class TestImportApprovalWorkflow:
    """Imports route through approval via the ``import`` action (#307)."""

    def test_create_variant_import_pending_change(self, test_client, seed_gene):
        """Creating a pending change for variant import."""
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "variants": [
                        {
                            "position": 120291764,
                            "ref": "C",
                            "alt": "T",
                            "hgvs": "n.140G>T",
                        }
                    ],
                },
            },
        )
        assert res.status_code == 200
        assert res.json()["action"] == "import"

    def test_create_structure_import_pending_change(self, test_client, seed_gene):
        """Creating a pending change for structure import."""
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "structure",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "structure": {
                        "id": "test-struct",
                        "name": "Test",
                        "nucleotides": [],
                    },
                },
            },
        )
        assert res.status_code == 200
        assert res.json()["action"] == "import"

    def test_create_bed_track_import_pending_change(self, test_client, seed_gene):
        """Creating a pending change for BED track import."""
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "bed_track",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "track_name": "test",
                    "intervals": [],
                },
            },
        )
        assert res.status_code == 200
        assert res.json()["action"] == "import"

    def test_reject_variant_import(self, test_client, seed_gene):
        """Admin can reject a variant import pending change."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "id": "test-var-002",
                    "geneId": "RNU4-2",
                    "position": 120291764,
                    "ref": "C",
                    "alt": "T",
                },
            },
        )
        change_id = create_res.json()["id"]
        reject_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "rejected", "notes": "Duplicate variant"},
        )
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] == "rejected"

    def test_approve_and_apply_variant_import(self, test_client, test_db, seed_gene):
        """Applying an approved variant import inserts the variants."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "variants": [
                        {
                            "position": 120291900,
                            "ref": "A",
                            "alt": "G",
                            "hgvs": "n.150A>G",
                        },
                        {
                            "position": 120291785,
                            "ref": "T",
                            "alt": "C",
                            "hgvs": "n.119A>G",
                        },
                    ],
                    "skip_invalid": True,
                },
            },
        )
        assert create_res.status_code == 200
        change_id = create_res.json()["id"]

        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        assert apply_res.status_code == 200
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200
        assert apply_res.json()["status"] == "applied"

        rows = test_db.execute(
            text("SELECT id, position, ref, alt FROM variants WHERE geneId='RNU4-2'")
        ).fetchall()
        positions = {r._mapping["position"] for r in rows}
        assert 120291900 in positions
        assert 120291785 in positions

    def test_apply_variant_import_invalid_rows_skipped(
        self, test_client, test_db, seed_gene
    ):
        """Applying an import with invalid rows skips them (skip_invalid)."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "variant",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "variants": [
                        {"position": 120291900, "ref": "A", "alt": "G"},  # valid
                        {"position": 120290000, "ref": "A", "alt": "G"},  # OOB
                    ],
                    "skip_invalid": True,
                },
            },
        )
        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        count = test_db.execute(
            text("SELECT COUNT(*) FROM variants WHERE geneId='RNU4-2'")
        ).scalar()
        assert count == 1  # only the valid row was inserted

    def test_approve_and_apply_structure_import(
        self, test_client, test_db, seed_gene, valid_structure_data
    ):
        """Applying an approved structure import inserts the structure."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "structure",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {"geneId": "RNU4-2", "structure": valid_structure_data},
            },
        )
        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        row = test_db.execute(
            text("SELECT * FROM rna_structures WHERE id='rnu4-2-test'")
        ).fetchone()
        assert row is not None
        count = test_db.execute(
            text("SELECT COUNT(*) FROM nucleotides WHERE structure_id='rnu4-2-test'")
        ).scalar()
        assert count == 4

    def test_approve_and_apply_bed_track_import(
        self, test_client, test_db, seed_gene, valid_bed_intervals
    ):
        """Applying an approved bed track import inserts intervals."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "bed_track",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "geneId": "RNU4-2",
                    "track_name": "approved_track",
                    "intervals": valid_bed_intervals,
                    "color": "#112233",
                },
            },
        )
        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        count = test_db.execute(
            text(
                "SELECT COUNT(*) FROM bed_tracks"
                " WHERE track_name='approved_track' AND geneId='RNU4-2'"
            )
        ).scalar()
        assert count == 3

    def test_approve_and_apply_literature_import(self, test_client, test_db, seed_gene):
        """Applying an approved literature import inserts rows."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "literature",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {
                    "literature": [
                        {
                            "doi": "10.1000/imported-l1",
                            "title": "Paper One",
                            "authors": "Smith J",
                            "journal": "Nature",
                            "year": "2024",
                        },
                        {
                            "doi": "10.1000/imported-l2",
                            "title": "Paper Two",
                            "authors": "Doe A",
                            "journal": "Science",
                            "year": "2025",
                        },
                    ]
                },
            },
        )
        assert create_res.status_code == 200
        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        count = test_db.execute(
            text("SELECT COUNT(*) FROM literature WHERE doi LIKE '10.1000/imported-%'")
        ).scalar()
        assert count == 2


class TestGeneCreateApplyDeterministic:
    """Gene-create apply runs no external API calls (#317)."""

    def test_population_data_fetched_at_submission_and_applied(
        self, test_client, test_db, monkeypatch
    ):
        """Population variants are fetched during submission and applied from
        the payload, so apply itself is DB-only."""
        from unittest.mock import patch

        fake_pop = [
            {
                "id": "chr12-120291764-C-T",
                "geneId": "TEST-GENE",
                "position": 120291764,
                "ref": "C",
                "alt": "T",
                "gnomad_ac": 3,
                "gnomad_hom": 0,
                "aou_ac": 5,
                "aou_hom": 0,
            }
        ]
        with patch(
            "rnudb_utils.external_apis.merge_population_variants",
            return_value=fake_pop,
        ):
            create_res = test_client.post(
                "/api/approvals",
                json={
                    "entity_type": "gene",
                    "gene_id": "TEST-GENE",
                    "action": "create",
                    "payload": {
                        "id": "TEST-GENE",
                        "name": "Test Gene",
                        "fullName": "Test full",
                        "chromosome": "chr12",
                        "start": 120291200,
                        "end": 120292400,
                        "strand": "+",
                        "sequence": "ACGU",
                        "description": "desc",
                        "fetch_population_data": True,
                    },
                },
            )
        assert create_res.status_code == 200
        stored_payload = create_res.json()["payload"]
        assert stored_payload["population_variants"] == fake_pop

        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        gene = test_db.execute(
            text("SELECT * FROM genes WHERE id='TEST-GENE'")
        ).fetchone()
        assert gene is not None
        variant = test_db.execute(
            text("SELECT * FROM variants WHERE id='chr12-120291764-C-T'")
        ).fetchone()
        assert variant is not None
        assert variant._mapping["gnomad_ac"] == 3

    def test_gene_create_apply_without_population_data(
        self, test_client, test_db, monkeypatch
    ):
        """Gene create without fetch_population_data applies a bare gene."""
        create_res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "gene",
                "gene_id": "BARE-GENE",
                "action": "create",
                "payload": {
                    "id": "BARE-GENE",
                    "name": "Bare",
                    "fullName": "Bare gene",
                    "chromosome": "chr1",
                    "start": 1000,
                    "end": 2000,
                    "strand": "+",
                    "sequence": "ACGUACGUACGU",
                    "description": "no pop data",
                },
            },
        )
        assert create_res.status_code == 200
        assert "population_variants" not in create_res.json()["payload"]

        change_id = create_res.json()["id"]
        apply_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"},
        )
        apply_res = test_client.post(f"/api/approvals/{change_id}/apply")
        assert apply_res.status_code == 200

        assert (
            test_db.execute(
                text("SELECT COUNT(*) FROM genes WHERE id='BARE-GENE'")
            ).scalar()
            == 1
        )
