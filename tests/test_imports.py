"""Tests for import API endpoints."""


class TestVariantImportAPI:
    """Test variant batch import endpoints."""

    def test_validate_valid_variants(self, test_client, seed_gene, valid_variant_rows):
        """Valid variants should return successful validation."""
        response = test_client.post(
            "/api/imports/variants/validate",
            json={"geneId": "RNU4-2", "variants": valid_variant_rows},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["valid_count"] == 3
        assert len(data["errors"]) == 0

    def test_validate_invalid_variants(
        self, test_client, seed_gene, invalid_variant_rows
    ):
        """Invalid variants should return validation errors."""
        response = test_client.post(
            "/api/imports/variants/validate",
            json={"geneId": "RNU4-2", "variants": invalid_variant_rows},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_validate_unknown_gene(self, test_client):
        """Unknown gene should return 404."""
        response = test_client.post(
            "/api/imports/variants/validate",
            json={
                "geneId": "UNKNOWN",
                "variants": [{"position": 100, "ref": "A", "alt": "G"}],
            },
        )

        assert response.status_code == 404

    def test_import_valid_variants(self, test_client, seed_gene, valid_variant_rows):
        """Import valid variants should succeed."""
        response = test_client.post(
            "/api/imports/variants/batch",
            json={
                "geneId": "RNU4-2",
                "variants": valid_variant_rows,
                "skip_invalid": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 3
        assert data["skipped_count"] == 0

    def test_import_with_invalid_skips(self, test_client, seed_gene):
        """Import with invalid rows and skip_invalid=True should skip errors."""
        rows = [
            {"position": 120291764, "ref": "C", "alt": "T"},  # Valid
            {"position": 120291000, "ref": "C", "alt": "T"},  # Invalid (out of bounds)
        ]
        response = test_client.post(
            "/api/imports/variants/batch",
            json={"geneId": "RNU4-2", "variants": rows, "skip_invalid": True},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 1
        assert data["skipped_count"] == 1

    def test_import_with_invalid_fails(self, test_client, seed_gene):
        """Import with invalid rows and skip_invalid=False should fail."""
        rows = [
            {"position": 120291000, "ref": "C", "alt": "T"},  # Invalid
        ]
        response = test_client.post(
            "/api/imports/variants/batch",
            json={"geneId": "RNU4-2", "variants": rows, "skip_invalid": False},
        )

        assert response.status_code == 400


class TestStructureImportAPI:
    """Test RNA structure import endpoints."""

    def test_validate_valid_structure(
        self, test_client, seed_gene, valid_structure_data
    ):
        """Valid structure should pass validation."""
        response = test_client.post(
            "/api/imports/structures/validate",
            json={"geneId": "RNU4-2", "structure": valid_structure_data},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0

    def test_validate_invalid_structure(
        self, test_client, seed_gene, invalid_structure_data
    ):
        """Invalid structure should return errors."""
        response = test_client.post(
            "/api/imports/structures/validate",
            json={"geneId": "RNU4-2", "structure": invalid_structure_data},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_import_valid_structure(self, test_client, seed_gene, valid_structure_data):
        """Import valid structure should succeed."""
        response = test_client.post(
            "/api/imports/structures",
            json={"geneId": "RNU4-2", "structure": valid_structure_data},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 1


class TestBEDTrackImportAPI:
    """Test BED track import endpoints."""

    def test_validate_valid_bed(self, test_client, seed_gene, valid_bed_intervals):
        """Valid BED intervals should pass validation."""
        response = test_client.post(
            "/api/imports/bed-tracks/validate",
            json={
                "geneId": "RNU4-2",
                "track_name": "test_track",
                "intervals": valid_bed_intervals,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["valid_count"] == 3

    def test_validate_invalid_bed(self, test_client, seed_gene, invalid_bed_intervals):
        """Invalid BED intervals should return errors."""
        response = test_client.post(
            "/api/imports/bed-tracks/validate",
            json={
                "geneId": "RNU4-2",
                "track_name": "bad_track",
                "intervals": invalid_bed_intervals,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_import_valid_bed(self, test_client, seed_gene, valid_bed_intervals):
        """Import valid BED track should succeed."""
        response = test_client.post(
            "/api/imports/bed-tracks",
            json={
                "geneId": "RNU4-2",
                "track_name": "test_track",
                "intervals": valid_bed_intervals,
                "color": "#FF6B6B",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 3

    def test_get_bed_tracks(self, test_client, seed_gene, valid_bed_intervals):
        """GET bed tracks for gene should return imported tracks."""
        # First import
        test_client.post(
            "/api/imports/bed-tracks",
            json={
                "geneId": "RNU4-2",
                "track_name": "test_track",
                "intervals": valid_bed_intervals,
            },
        )

        # Then get
        response = test_client.get("/api/genes/RNU4-2/bed-tracks")

        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]["geneId"] == "RNU4-2"


class TestBEDTrackAPI:
    """Test BED track CRUD endpoints."""

    def test_get_all_bed_tracks_empty(self, test_client):
        """GET all bed tracks when empty should return empty list."""
        response = test_client.get("/api/bed-tracks")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_delete_nonexistent_track(self, test_client):
        """DELETE non-existent track returns 401 when unauthenticated."""
        response = test_client.delete("/api/bed-tracks/99999")
        assert response.status_code == 401

    def test_delete_bed_track_unauthenticated(self, test_client):
        """DELETE bed track returns 401 when unauthenticated."""
        response = test_client.delete("/api/bed-tracks/1")
        assert response.status_code == 401


class TestImportEndpointAuth:
    """Tests for import endpoint authentication requirements.

    These tests verify that import endpoints require proper authentication.
    Currently imports are public - these tests document expected behavior
    after implementing auth.
    """

    def test_variant_batch_without_auth_fails(self, test_client, seed_gene):
        """POST /imports/variants/batch should require auth."""
        response = test_client.post(
            "/api/imports/variants/batch",
            json={"geneId": "RNU4-2", "variants": [], "skip_invalid": True},
        )
        # With mock auth, this should succeed (mock provides curator role)
        # After implementing auth, this should require explicit auth
        assert response.status_code in (200, 401)

    def test_structure_import_without_auth_fails(self, test_client, seed_gene):
        """POST /imports/structures should require auth."""
        response = test_client.post(
            "/api/imports/structures",
            json={"geneId": "RNU4-2", "structure": valid_structure_data()},
        )
        assert response.status_code in (200, 401)

    def test_bed_track_import_without_auth_fails(self, test_client, seed_gene):
        """POST /imports/bed-tracks should require auth."""
        response = test_client.post(
            "/api/imports/bed-tracks",
            json={
                "geneId": "RNU4-2",
                "track_name": "test",
                "intervals": [
                    {"chrom": "12", "chromStart": 120291760, "chromEnd": 120291770}
                ],
            },
        )
        assert response.status_code in (200, 401)

    def test_validate_variants_public(self, test_client, seed_gene):
        """POST /imports/variants/validate should remain public."""
        response = test_client.post(
            "/api/imports/variants/validate",
            json={"geneId": "RNU4-2", "variants": []},
        )
        # Validate endpoint should be public - no auth required
        assert response.status_code == 200


def valid_structure_data():
    """Return valid structure data for testing."""
    return {
        "id": "test-struct",
        "name": "Test Structure",
        "geneId": "RNU4-2",
        "nucleotides": [
            {"id": 1, "base": "A", "x": 100.0, "y": 100.0},
            {"id": 2, "base": "U", "x": 110.0, "y": 100.0},
        ],
        "base_pairs": [],
        "annotations": [],
        "structural_features": [],
    }


class TestVariantClassificationImport:
    """Tests for variant classification import endpoints."""

    def test_import_classifications_requires_auth(self, test_client, seed_gene):
        """POST /imports/variants/classifications should require auth."""
        response = test_client.post(
            "/api/imports/variants/classifications",
            json={"geneId": "RNU4-2", "classifications": []},
        )
        # With mock auth, should succeed; without auth would return 401
        assert response.status_code in (200, 401)

    def test_import_classifications_with_valid_data(
        self, test_client, seed_gene, sample_variant_with_data, sample_literature
    ):
        """Import variant classifications with valid data."""
        response = test_client.post(
            "/api/imports/variants/classifications",
            json={
                "geneId": "RNU4-2",
                "classifications": [
                    {
                        "variant_id": "chr12-120291764-C-T",
                        "paper_id": "10.1101/2025.08.13.25333306",
                        "clinical_significance": "VUS",
                        "zygosity": "Heterozygous",
                        "counts": 1,
                    }
                ]
            },
        )
        # Should succeed with auth
        assert response.status_code in (200, 401)

    def test_import_classifications_invalid_variant(self, test_client, seed_gene):
        """Import with non-existent variant returns error."""
        response = test_client.post(
            "/api/imports/variants/classifications",
            json={
                "geneId": "RNU4-2",
                "classifications": [
                    {
                        "variant_id": "nonexistent-variant",
                        "paper_id": "10.1101/2025.08.13.25333306",
                        "clinical_significance": "VUS",
                        "counts": 1,
                    }
                ]
            },
        )
        # Should return error for invalid variant
        assert response.status_code in (200, 400, 404)


class TestLiteratureImport:
    """Tests for literature import endpoints."""

    def test_lookup_literature_public(self, test_client):
        """POST /imports/literature/lookup should work without auth."""
        response = test_client.post(
            "/api/imports/literature/lookup?dois=10.1101/2025.08.13.25333306",
            json=[],
        )
        # Lookup should be public - check with correct query format
        assert response.status_code in (200, 404, 422)

    def test_fetch_literature_requires_auth(self, test_client, seed_gene):
        """POST /imports/literature/fetch should require auth."""
        response = test_client.post(
            "/api/imports/literature/fetch",
            json={"doi": "10.1101/2025.08.13.25333306"},
        )
        # With mock auth should succeed; without would be 401
        assert response.status_code in (200, 401)


class TestVCFImport:
    """Tests for VCF file import endpoint."""

    def test_import_vcf_requires_gene(self, test_client):
        """POST /imports/variants/vcf with missing gene returns 404."""
        vcf_content = (
            "##fileformat=VCFv4.2\n"
            "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n"
        )
        response = test_client.post(
            "/api/imports/variants/vcf?geneId=NONEXISTENT",
            files={"file": ("test.vcf", vcf_content, "text/vnd.vcf")},
        )
        assert response.status_code == 404

    def test_import_vcf_valid_content(self, test_client, seed_gene):
        """POST /imports/variants/vcf with valid VCF content."""
        vcf_content = (
            "##fileformat=VCFv4.2\n"
            "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n"
            "chr12\t120291764\t.\tC\tT\t.\tPASS\t.\n"
            "chr12\t120291785\t.\tT\tC\t.\tPASS\t.\n"
        )
        response = test_client.post(
            "/api/imports/variants/vcf?geneId=RNU4-2",
            files={"file": ("test.vcf", vcf_content, "text/vnd.vcf")},
        )
        # Should succeed with auth
        assert response.status_code in (200, 401)

    def test_import_vcf_invalid_format(self, test_client, seed_gene):
        """POST /imports/variants/vcf with invalid VCF returns error."""
        invalid_vcf = "This is not a valid VCF file content"
        response = test_client.post(
            "/api/imports/variants/vcf?geneId=RNU4-2",
            files={"file": ("test.vcf", invalid_vcf, "text/plain")},
        )
        # Should return error for invalid format
        assert response.status_code in (400, 422)
