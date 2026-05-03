"""Tests for approval workflow (pending_changes table)."""


import pytest


class TestApprovalsAPI:
    """Tests for the curator approval workflow."""

    def _create_pending(self, client, payload):
        """Helper: create a pending change."""
        return client.post("/api/approvals", json=payload)

    def test_create_pending_change(self, test_client):
        """Curator can submit a change request."""
        res = self._create_pending(test_client, {
            "entity_type": "variant",
            "entity_id": None,
            "gene_id": "RNU4-2",
            "action": "update",
            "payload": {"id": "V1", "clinical_significance": "Pathogenic"}
        })
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "pending"
        assert data["requested_by"] == "test_curator"
        assert data["entity_type"] == "variant"

    def test_list_pending_shows_own(self, test_client):
        """Curator only sees their own submissions."""
        self._create_pending(test_client, {
            "entity_type": "variant",
            "gene_id": "RNU4-2",
            "action": "update",
            "payload": {"id": "V2"}
        })
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
        create_res = self._create_pending(test_client, {
            "entity_type": "variant",
            "gene_id": "RNU4-2",
            "action": "update",
            "payload": {"id": "V3", "note": "approve me"}
        })
        change_id = create_res.json()["id"]

        # Review
        review_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved", "notes": "Looks good"}
        )
        assert review_res.status_code == 200
        reviewed = review_res.json()
        assert reviewed["status"] == "approved"
        assert reviewed["reviewed_by"] == "test_curator"  # same user due to mock
        assert reviewed["review_notes"] == "Looks good"

    def test_review_reject(self, test_client):
        """Admin can reject a pending change."""
        create_res = self._create_pending(test_client, {
            "entity_type": "gene",
            "gene_id": "RNU2-2",
            "action": "create",
            "payload": {"name": "RNU2-2"}
        })
        change_id = create_res.json()["id"]

        reject_res = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "rejected", "notes": "Missing required fields"}
        )
        assert reject_res.status_code == 200
        reviewed = reject_res.json()
        assert reviewed["status"] == "rejected"
        assert reviewed["review_notes"] == "Missing required fields"

    def test_double_review_blocked(self, test_client):
        """Cannot review an already reviewed change."""
        create_res = self._create_pending(test_client, {
            "entity_type": "variant",
            "gene_id": "RNU4-2",
            "action": "delete",
            "payload": {"id": "V4"}
        })
        change_id = create_res.json()["id"]

        # First review
        test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "approved"}
        )

        # Second review should 400
        second = test_client.post(
            f"/api/approvals/{change_id}/review",
            json={"status": "rejected"}
        )
        assert second.status_code == 400
        assert "already reviewed" in second.json()["detail"].lower()

    def test_get_single_change(self, test_client):
        """Can fetch a change by ID."""
        create_res = self._create_pending(test_client, {
            "entity_type": "literature",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {"pmid": "123456"}
        })
        change_id = create_res.json()["id"]

        get_res = test_client.get(f"/api/approvals/{change_id}")
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["id"] == change_id
        assert data["payload"]["pmid"] == "123456"

    def test_invalid_entity_type_rejected(self, test_client):
        """Invalid entity_type returns 422."""
        res = test_client.post("/api/approvals", json={
            "entity_type": "invalid_type",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {}
        })
        assert res.status_code == 422

    def test_invalid_action_rejected(self, test_client):
        """Invalid action returns 422."""
        res = test_client.post("/api/approvals", json={
            "entity_type": "variant",
            "gene_id": "RNU4-2",
            "action": "merge",  # invalid
            "payload": {}
        })
        assert res.status_code == 422

    def test_filter_by_status(self, test_client):
        """Filtering by status returns only matching records."""
        # Create 2 pending + approve 1
        r1 = self._create_pending(test_client, {
            "entity_type": "variant", "gene_id": "RNU4-2",
            "action": "update", "payload": {"id": "V5"}
        })
        self._create_pending(test_client, {
            "entity_type": "variant", "gene_id": "RNU4-2",
            "action": "update", "payload": {"id": "V6"}
        })
        test_client.post(f"/api/approvals/{r1.json()['id']}/review", json={"status": "approved"})

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
        self._create_pending(test_client, {
            "entity_type": "variant", "gene_id": "RNU4-2",
            "action": "update", "payload": {}
        })
        self._create_pending(test_client, {
            "entity_type": "variant", "gene_id": "RNU2-2",
            "action": "update", "payload": {}
        })

        res = test_client.get("/api/approvals?gene_id=RNU4-2")
        assert res.status_code == 200
        data = res.json()
        assert all(item["gene_id"] == "RNU4-2" for item in data)
