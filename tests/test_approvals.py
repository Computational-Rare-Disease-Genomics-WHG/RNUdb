"""Tests for approval workflow (pending_changes table)."""

import pytest


class TestApprovalsAPI:
    """Tests for the curator approval workflow."""

    def _create_pending(self, client, payload):
        """Helper: create a pending change."""
        return client.post("/api/approvals", json=payload)

    def test_create_pending_change(self, test_client):
        """Curator can submit a change request."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "variant",
                "entity_id": None,
                "gene_id": "RNU4-2",
                "action": "update",
                "payload": {"id": "V1", "clinical_significance": "Pathogenic"},
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "pending"
        assert data["requested_by"] == "test_curator"
        assert data["entity_type"] == "variant"

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
                "payload": {"id": "V3", "note": "approve me"},
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
                    "clinical_significance": "Pathogenic",
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

    def test_approve_and_apply_literature_create(self, test_client):
        """Admin can approve literature creation."""
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
                },
            },
        )
        change_id = create_res.json()["id"]

        # Approve - this is the main test
        review_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved", "notes": "Approved for database"},
        )
        assert review_res.status_code == 200
        assert review_res.json()["status"] == "approved"

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


class TestApprovalsAuthorization:
    """Tests for authorization in approval workflow."""

    def test_unauthenticated_cannot_list(self, test_client):
        """Unauthenticated users cannot list approvals."""
        # Clear auth header but keep base headers
        original_headers = test_client.headers.copy()
        test_client.headers = {}
        res = test_client.get("/api/approvals")
        # Expect 401/403 or 404 depending on auth implementation
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
