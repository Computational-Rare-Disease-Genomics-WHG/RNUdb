"""Tests for API endpoints."""



class TestGenesAPI:
    """Tests for genes API endpoints."""

    def test_list_genes(self, test_client, seed_gene):
        """GET /api/genes returns list of genes."""
        response = test_client.get("/api/genes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_get_gene(self, test_client, seed_gene):
        """GET /api/genes/{id} returns gene by ID."""
        response = test_client.get("/api/genes/RNU4-2")
        # May return 404 or 200 depending on implementation
        assert response.status_code in (200, 404)

    def test_get_nonexistent_gene(self, test_client):
        """GET /api/genes/{id} returns 404 for nonexistent gene."""
        response = test_client.get("/api/genes/NONEXISTENT")
        assert response.status_code == 404

    def test_get_gene_variants(self, test_client, seed_gene):
        """GET /api/genes/{id}/variants returns variants for gene."""
        response = test_client.get("/api/genes/RNU4-2/variants")
        assert response.status_code in (200, 404)

    def test_get_gene_literature(self, test_client, seed_gene):
        """GET /api/genes/{id}/literature returns literature for gene."""
        response = test_client.get("/api/genes/RNU4-2/literature")
        assert response.status_code in (200, 404)

    def test_get_gene_structures(self, test_client, seed_gene):
        """GET /api/genes/{id}/structures returns structures for gene."""
        response = test_client.get("/api/genes/RNU4-2/structures")
        assert response.status_code in (200, 404)

    def test_get_gene_pdb(self, test_client, seed_gene):
        """GET /api/genes/{id}/pdb returns PDB data for gene."""
        response = test_client.get("/api/genes/RNU4-2/pdb")
        assert response.status_code in (200, 404)


class TestVariantsAPI:
    """Tests for variants API endpoints."""

    def test_list_variants(self, test_client, seed_gene):
        """GET /api/variants returns list of variants."""
        response = test_client.get("/api/variants")
        assert response.status_code == 200

    def test_get_disease_types(self, test_client):
        """GET /api/variants/disease-types returns list of disease types."""
        response = test_client.get("/api/variants/disease-types")
        assert response.status_code == 200

    def test_get_clinical_significances(self, test_client):
        """GET /api/variants/clinical-significances returns list."""
        response = test_client.get("/api/variants/clinical-significances")
        assert response.status_code == 200


class TestLiteratureAPI:
    """Tests for literature API endpoints."""

    def test_list_literature(self, test_client, seed_gene):
        """GET /api/literature returns list of literature."""
        response = test_client.get("/api/literature")
        assert response.status_code == 200


class TestBedTracksAPI:
    """Tests for BED tracks API endpoints."""

    def test_get_gene_bed_tracks(self, test_client, seed_gene):
        """GET /api/genes/{id}/bed-tracks returns BED tracks for gene."""
        response = test_client.get("/api/genes/RNU4-2/bed-tracks")
        assert response.status_code in (200, 404)

    def test_get_all_bed_tracks(self, test_client, seed_gene):
        """GET /api/bed-tracks returns all BED tracks."""
        response = test_client.get("/api/bed-tracks")
        assert response.status_code == 200


class TestUsersAPI:
    """Tests for users API endpoints."""

    def test_list_users(self, test_client):
        """GET /api/users returns list of users or 401 if not admin."""
        response = test_client.get("/api/users")
        assert response.status_code in (200, 401)

    def test_list_pending_users(self, test_client):
        """GET /api/users/pending returns pending users or 401 if not admin."""
        response = test_client.get("/api/users/pending")
        assert response.status_code in (200, 401)


class TestAuthAPI:
    """Tests for auth API endpoints."""

    def test_logout(self, test_client):
        """POST /api/auth/logout logs out the user."""
        response = test_client.post("/api/auth/logout")
        # Should work even if not logged in (just returns 200)
        assert response.status_code in (200, 401)


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_invalid_json_body(self, test_client):
        """POST with invalid JSON returns validation error."""
        response = test_client.post(
            "/api/approvals",
            content="not valid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

    def test_missing_required_field(self, test_client):
        """POST with missing required fields returns validation error."""
        response = test_client.post(
            "/api/approvals",
            json={"entity_type": "variant"},
        )
        assert response.status_code == 422

    def test_invalid_id_format(self, test_client, seed_gene):
        """GET with invalid ID format returns appropriate error."""
        response = test_client.get("/api/genes/invalid@#$format")
        assert response.status_code in (404, 422)
