"""Tests for import API endpoints."""



class TestVariantImportAPI:
    """Test variant batch import endpoints."""

    def test_validate_valid_variants(self, test_client, valid_variant_rows):
        """Valid variants should return successful validation."""
        response = test_client.post("/api/imports/variants/validate", json={
            "geneId": "RNU4-2",
            "variants": valid_variant_rows
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["valid_count"] == 3
        assert len(data["errors"]) == 0

    def test_validate_invalid_variants(self, test_client, invalid_variant_rows):
        """Invalid variants should return validation errors."""
        response = test_client.post("/api/imports/variants/validate", json={
            "geneId": "RNU4-2",
            "variants": invalid_variant_rows
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_validate_unknown_gene(self, test_client):
        """Unknown gene should return 404."""
        response = test_client.post("/api/imports/variants/validate", json={
            "geneId": "UNKNOWN",
            "variants": [{"position": 100, "ref": "A", "alt": "G"}]
        })

        assert response.status_code == 404

    def test_import_valid_variants(self, test_client, valid_variant_rows):
        """Import valid variants should succeed."""
        response = test_client.post("/api/imports/variants/batch", json={
            "geneId": "RNU4-2",
            "variants": valid_variant_rows,
            "skip_invalid": True
        })

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 3
        assert data["skipped_count"] == 0

    def test_import_with_invalid_skips(self, test_client):
        """Import with invalid rows and skip_invalid=True should skip errors."""
        rows = [
            {"position": 120291764, "ref": "C", "alt": "T"},  # Valid
            {"position": 120291000, "ref": "C", "alt": "T"},  # Invalid (out of bounds)
        ]
        response = test_client.post("/api/imports/variants/batch", json={
            "geneId": "RNU4-2",
            "variants": rows,
            "skip_invalid": True
        })

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 1
        assert data["skipped_count"] == 1

    def test_import_with_invalid_fails(self, test_client):
        """Import with invalid rows and skip_invalid=False should fail."""
        rows = [
            {"position": 120291000, "ref": "C", "alt": "T"},  # Invalid
        ]
        response = test_client.post("/api/imports/variants/batch", json={
            "geneId": "RNU4-2",
            "variants": rows,
            "skip_invalid": False
        })

        assert response.status_code == 400


class TestStructureImportAPI:
    """Test RNA structure import endpoints."""

    def test_validate_valid_structure(self, test_client, valid_structure_data):
        """Valid structure should pass validation."""
        response = test_client.post("/api/imports/structures/validate", json={
            "geneId": "RNU4-2",
            "structure": valid_structure_data
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0

    def test_validate_invalid_structure(self, test_client, invalid_structure_data):
        """Invalid structure should return errors."""
        response = test_client.post("/api/imports/structures/validate", json={
            "geneId": "RNU4-2",
            "structure": invalid_structure_data
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_import_valid_structure(self, test_client, valid_structure_data):
        """Import valid structure should succeed."""
        response = test_client.post("/api/imports/structures", json={
            "geneId": "RNU4-2",
            "structure": valid_structure_data
        })

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 1


class TestBEDTrackImportAPI:
    """Test BED track import endpoints."""

    def test_validate_valid_bed(self, test_client, valid_bed_intervals):
        """Valid BED intervals should pass validation."""
        response = test_client.post("/api/imports/bed-tracks/validate", json={
            "geneId": "RNU4-2",
            "track_name": "test_track",
            "intervals": valid_bed_intervals
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["valid_count"] == 3

    def test_validate_invalid_bed(self, test_client, invalid_bed_intervals):
        """Invalid BED intervals should return errors."""
        response = test_client.post("/api/imports/bed-tracks/validate", json={
            "geneId": "RNU4-2",
            "track_name": "bad_track",
            "intervals": invalid_bed_intervals
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_import_valid_bed(self, test_client, valid_bed_intervals):
        """Import valid BED track should succeed."""
        response = test_client.post("/api/imports/bed-tracks", json={
            "geneId": "RNU4-2",
            "track_name": "test_track",
            "intervals": valid_bed_intervals,
            "color": "#FF6B6B"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported_count"] == 3

    def test_get_bed_tracks(self, test_client, valid_bed_intervals):
        """GET bed tracks for gene should return imported tracks."""
        # First import
        test_client.post("/api/imports/bed-tracks", json={
            "geneId": "RNU4-2",
            "track_name": "test_track",
            "intervals": valid_bed_intervals
        })

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
        """DELETE non-existent track returns 401 when unauthenticated (requires admin)."""
        response = test_client.delete("/api/bed-tracks/99999")
        assert response.status_code == 401

    def test_delete_bed_track_unauthenticated(self, test_client):
        """DELETE bed track returns 401 when unauthenticated."""
        response = test_client.delete("/api/bed-tracks/1")
        assert response.status_code == 401
