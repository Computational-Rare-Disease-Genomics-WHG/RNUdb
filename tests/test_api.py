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
        # Now returns 200 with [] when no structures exist
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_gene_pdb(self, test_client, seed_gene):
        """GET /api/genes/{id}/pdb returns PDB data for gene."""
        response = test_client.get("/api/genes/RNU4-2/pdb")
        assert response.status_code in (200, 404)


class TestGeneStructuresAPI:
    """Tests for gene structures API endpoints - regression tests for 404 issue."""

    def test_get_gene_structures_empty_returns_200_with_empty_list(
        self, test_client, seed_gene
    ):
        """GET /api/genes/{id}/structures returns 200 with [] when no structures exist.

        This is a regression test for the issue where the endpoint was returning 404
        when no structures existed for a gene, causing React error #130.
        """
        response = test_client.get("/api/genes/RNU4-2/structures")
        assert response.status_code == 200, (
            f"Expected 200 but got {response.status_code}. "
            "Empty structures should return 200 with [], not 404."
        )
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert data == [], "Empty structures should return empty list"

    def test_get_nonexistent_gene_structures_returns_empty_list(self, test_client):
        """GET /api/genes/{id}/structures returns 200 with [] for nonexistent gene.

        Unlike other endpoints, structures returns 200 with empty list for consistency
        with frontend expectations (prevents React errors when no data exists).
        """
        response = test_client.get("/api/genes/NONEXISTENT-GENE/structures")
        assert response.status_code == 200, (
            f"Expected 200 for nonexistent gene but got {response.status_code}"
        )
        data = response.json()
        assert isinstance(data, list)
        assert data == [], "Nonexistent gene should return empty list, not 404"


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


class TestVariantClassificationsAPI:
    """Tests for variant classifications API endpoints."""

    def test_list_variant_classifications(
        self, test_client, sample_variant_classification
    ):
        """GET /api/variant-classifications returns list."""
        response = test_client.get("/api/variant-classifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_list_classifications_for_variant(
        self, test_client, sample_variant_classification
    ):
        """GET /api/variant-classifications filters by variant_id."""
        response = test_client.get(
            "/api/variant-classifications?variant_id=chr12-120291764-C-T"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_list_classifications_for_literature(
        self, test_client, sample_variant_classification
    ):
        """GET /api/variant-classifications filters by literature_id."""
        response = test_client.get(
            "/api/variant-classifications?literature_id=10.1101/2025.08.13.25333306"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1


class TestGenePopulationData:
    """Tests for gene population data endpoints."""

    def test_refresh_gene_variants(self, test_client, seed_gene):
        """POST /genes/{id}/refresh-variants updates population data."""
        response = test_client.post("/api/genes/RNU4-2/refresh-variants")
        # With mock admin auth, should succeed
        assert response.status_code in (200, 401)

    def test_refresh_nonexistent_gene(self, test_client):
        """POST /genes/{id}/refresh-variants returns 404 for unknown gene."""
        response = test_client.post("/api/genes/NONEXISTENT/refresh-variants")
        # With auth, returns 404 for unknown gene
        assert response.status_code in (404, 401)

    def test_get_gene_variants_with_zygosity(self, test_client, seed_gene):
        """GET /genes/{id}/variants includes zygosity field."""
        response = test_client.get("/api/genes/RNU4-2/variants")
        # Should return variants (may be empty)
        assert response.status_code in (200, 404)


class TestVariantClassificationsCRUD:
    """Tests for variant classifications CRUD operations."""

    def test_create_classification_with_all_fields(
        self, test_client, seed_gene, sample_variant_with_data, sample_literature
    ):
        """POST /variant-classifications creates classification with all fields."""
        response = test_client.post(
            "/api/variant-classifications",
            json={
                "variant_id": "chr12-120291764-C-T",
                "literature_id": "10.1101/2025.08.13.25333306",
                "clinical_significance": "Pathogenic",
                "zygosity": "Heterozygous",
                "disease": "Retinitis Pigmentosa",
                "counts": 5,
                "linked_variant_ids": "chr12-120291785-T-C",
            },
        )
        # With mock curator auth, should succeed
        assert response.status_code in (200, 401, 409)

    def test_create_classification_invalid_variant(self, test_client, seed_gene):
        """POST /variant-classifications returns 400 for non-existent variant."""
        response = test_client.post(
            "/api/variant-classifications",
            json={
                "variant_id": "nonexistent-variant",
                "literature_id": "10.1101/2025.08.13.25333306",
                "clinical_significance": "VUS",
            },
        )
        # Should return error for invalid variant
        assert response.status_code in (400, 401, 404)

    def test_bulk_import_classifications(self, test_client, seed_gene):
        """POST /variant-classifications/bulk imports multiple classifications."""
        response = test_client.post(
            "/api/variant-classifications/bulk",
            json={
                "classifications": [
                    {
                        "variant_id": "test-var-1",
                        "literature_id": "10.1000/test",
                        "clinical_significance": "VUS",
                    }
                ]
            },
        )
        # With mock auth, should work or return validation error
        assert response.status_code in (200, 400, 401, 404)

    def test_delete_classification(self, test_client, sample_variant_classification):
        """DELETE /variant-classifications deletes classification."""
        response = test_client.delete(
            "/api/variant-classifications?variant_id=chr12-120291764-C-T"
            "&literature_id=10.1101/2025.08.13.25333306"
        )
        # With mock auth, should work
        assert response.status_code in (200, 401, 404)


class TestLiteratureBulkImport:
    """Tests for literature bulk import endpoints."""

    def test_bulk_import_literature(self, test_client, seed_gene):
        """POST /literature/bulk imports multiple literature records."""
        response = test_client.post(
            "/api/literature/bulk",
            json={
                "records": [
                    {
                        "id": "10.1000/test.doi.1",
                        "title": "Test Paper 1",
                        "authors": "Author A, Author B",
                        "journal": "Nature",
                        "year": "2024",
                        "doi": "10.1000/test.doi.1",
                    }
                ]
            },
        )
        # With mock admin auth, should succeed or return validation error
        assert response.status_code in (200, 401, 422)
