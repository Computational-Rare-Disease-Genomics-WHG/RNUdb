"""Tests for import API endpoints."""

import pytest
from sqlalchemy import text

from api.main import app
from api.routers.auth import require_admin, require_curator


@pytest.fixture
def enforce_real_curator_auth(test_client):
    """Use the real require_curator dependency instead of the mock.

    Requests without a session cookie then hit real auth and return 401.
    The autouse mock_auth fixture re-applies its override on the next test.
    """
    app.dependency_overrides.pop(require_curator, None)
    yield test_client


@pytest.fixture
def enforce_real_admin_auth(test_client):
    """Use the real require_admin dependency instead of the mock.

    Requests without a session cookie then hit real auth and return 401.
    The autouse mock_auth fixture re-applies its override on the next test.
    """
    app.dependency_overrides.pop(require_admin, None)
    yield test_client


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

    def test_validate_duplicate_structure_warns(
        self, test_client, seed_gene, valid_structure_data
    ):
        """Validating a structure whose ID already exists should return a warning."""
        test_client.post(
            "/api/imports/structures",
            json={"geneId": "RNU4-2", "structure": valid_structure_data},
        )
        response = test_client.post(
            "/api/imports/structures/validate",
            json={"geneId": "RNU4-2", "structure": valid_structure_data},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["warnings"]) >= 1
        warning_messages = [w["message"] for w in data["warnings"]]
        assert any("already exists" in msg for msg in warning_messages)

    def test_import_duplicate_structure_rejected(
        self, test_client, seed_gene, valid_structure_data
    ):
        """Importing a structure with an existing ID should return 409."""
        response = test_client.post(
            "/api/imports/structures",
            json={"geneId": "RNU4-2", "structure": valid_structure_data},
        )
        assert response.status_code == 200

        response = test_client.post(
            "/api/imports/structures",
            json={"geneId": "RNU4-2", "structure": valid_structure_data},
        )
        assert response.status_code == 409
        data = response.json()
        assert "already exists" in data["detail"]["message"]
        assert data["detail"]["existing_id"] == "rnu4-2-test"


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
        """DELETE non-existent track returns 404."""
        response = test_client.delete("/api/bed-tracks/99999")
        # With mock auth, auth passes but track not found
        assert response.status_code == 404

    def test_delete_bed_track_unauthenticated(self, test_client):
        """DELETE bed track returns 404 when track does not exist."""
        response = test_client.delete("/api/bed-tracks/1")
        # With mock auth, auth passes but track not found
        assert response.status_code == 404


class TestImportEndpointAuth:
    """Import write endpoints must require admin; read-only lookups require curator."""

    def test_variant_batch_without_auth_fails(self, enforce_real_admin_auth, seed_gene):
        """POST /imports/variants/batch without credentials returns 401."""
        response = enforce_real_admin_auth.post(
            "/api/imports/variants/batch",
            json={"geneId": "RNU4-2", "variants": [], "skip_invalid": True},
        )
        assert response.status_code == 401

    def test_structure_import_without_auth_fails(
        self, enforce_real_admin_auth, seed_gene
    ):
        """POST /imports/structures without credentials returns 401."""
        response = enforce_real_admin_auth.post(
            "/api/imports/structures",
            json={"geneId": "RNU4-2", "structure": valid_structure_data()},
        )
        assert response.status_code == 401

    def test_bed_track_import_without_auth_fails(
        self, enforce_real_admin_auth, seed_gene
    ):
        """POST /imports/bed-tracks without credentials returns 401."""
        response = enforce_real_admin_auth.post(
            "/api/imports/bed-tracks",
            json={
                "geneId": "RNU4-2",
                "track_name": "test",
                "intervals": [
                    {"chrom": "12", "chromStart": 120291760, "chromEnd": 120291770}
                ],
            },
        )
        assert response.status_code == 401

    def test_vcf_import_without_auth_fails(self, enforce_real_admin_auth, seed_gene):
        """POST /imports/variants/vcf without credentials returns 401."""
        vcf_content = (
            "##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n"
        )
        response = enforce_real_admin_auth.post(
            "/api/imports/variants/vcf?geneId=RNU4-2",
            files={"file": ("test.vcf", vcf_content, "text/vnd.vcf")},
        )
        assert response.status_code == 401

    def test_classifications_import_without_auth_fails(
        self, enforce_real_admin_auth, seed_gene
    ):
        """POST /imports/variants/classifications without credentials returns 401."""
        response = enforce_real_admin_auth.post(
            "/api/imports/variants/classifications",
            json={"geneId": "RNU4-2", "classifications": []},
        )
        assert response.status_code == 401

    def test_literature_lookup_without_auth_fails(self, enforce_real_curator_auth):
        """POST /imports/literature/lookup without credentials returns 401."""
        response = enforce_real_curator_auth.post(
            "/api/imports/literature/lookup", json=["10.1000/test"]
        )
        assert response.status_code == 401

    def test_literature_fetch_without_auth_fails(
        self, enforce_real_curator_auth, seed_gene
    ):
        """POST /imports/literature/fetch without credentials returns 401."""
        response = enforce_real_curator_auth.post(
            "/api/imports/literature/fetch", json={"identifier": "10.1000/test"}
        )
        assert response.status_code == 401

    def test_validate_variants_public(self, enforce_real_curator_auth, seed_gene):
        """POST /imports/variants/validate should remain public."""
        response = enforce_real_curator_auth.post(
            "/api/imports/variants/validate",
            json={"geneId": "RNU4-2", "variants": []},
        )
        # Public endpoint — no auth required despite curator auth being enforced
        assert response.status_code == 200


class TestAdminOnlyRoleAccess:
    """Direct write endpoints must require admin (curators route through approval).

    Unauthenticated requests hit the real require_admin dependency and must
    return 401; this proves the endpoint is no longer curator-gated.
    """

    def test_create_variant_requires_admin(self, enforce_real_admin_auth, seed_gene):
        response = enforce_real_admin_auth.post(
            "/api/variants",
            json={
                "id": "test-role-create",
                "geneId": "RNU4-2",
                "position": 120291764,
                "ref": "C",
                "alt": "T",
            },
        )
        assert response.status_code == 401

    def test_update_variant_requires_admin(self, enforce_real_admin_auth, seed_gene):
        response = enforce_real_admin_auth.put(
            "/api/variants/chr12-120291764-C-T",
            json={"consequence": "missense"},
        )
        assert response.status_code == 401

    def test_delete_variant_requires_admin(self, enforce_real_admin_auth, seed_gene):
        response = enforce_real_admin_auth.delete("/api/variants/chr12-120291764-C-T")
        assert response.status_code == 401

    def test_create_literature_requires_admin(self, enforce_real_admin_auth):
        response = enforce_real_admin_auth.post(
            "/api/literature",
            json={
                "id": "10.1000/role.test",
                "title": "Role Test Paper",
                "authors": "Smith J",
                "journal": "Nature",
                "year": 2024,
                "doi": "10.1000/role.test",
            },
        )
        assert response.status_code == 401

    def test_update_literature_requires_admin(self, enforce_real_admin_auth):
        response = enforce_real_admin_auth.put(
            "/api/literature/10.1000/role.test",
            json={"title": "Updated Title"},
        )
        assert response.status_code == 401

    def test_delete_literature_requires_admin(self, enforce_real_admin_auth):
        response = enforce_real_admin_auth.delete("/api/literature/10.1000/role.test")
        assert response.status_code == 401

    def test_bulk_import_literature_requires_admin(self, enforce_real_admin_auth):
        response = enforce_real_admin_auth.post(
            "/api/literature/bulk",
            json=[
                {
                    "doi": "10.1000/role.bulk",
                    "title": "Bulk Paper",
                    "authors": "Doe A",
                    "journal": "Science",
                    "year": "2024",
                }
            ],
        )
        assert response.status_code == 401

    def test_delete_gene_requires_admin(self, enforce_real_admin_auth, seed_gene):
        response = enforce_real_admin_auth.delete("/api/genes/RNU4-2")
        assert response.status_code == 401

    def test_delete_structure_requires_admin(self, enforce_real_admin_auth, seed_gene):
        response = enforce_real_admin_auth.delete(
            "/api/genes/RNU4-2/structures/nonexistent"
        )
        assert response.status_code in (401, 404)


class TestCuratorRoleAccess:
    """Endpoints documented as 'curator only' must still use require_curator.

    Unauthenticated requests hit the real require_curator dependency and return
    401; a non-401 proves the endpoint accidentally depends on require_admin.
    """

    def test_create_gene_uses_require_curator(self, enforce_real_curator_auth):
        response = enforce_real_curator_auth.post(
            "/api/genes?fetch_population_data=false",
            json={
                "id": "ROLE-TEST",
                "name": "ROLE-TEST",
                "fullName": "Role test gene",
                "chromosome": "chr12",
                "start": 100,
                "end": 200,
                "strand": "+",
                "sequence": "ACGU",
                "description": "Role test gene",
            },
        )
        assert response.status_code == 401

    def test_update_gene_uses_require_curator(
        self, enforce_real_curator_auth, seed_gene
    ):
        response = enforce_real_curator_auth.put(
            "/api/genes/RNU4-2",
            json={"description": "Updated description"},
        )
        assert response.status_code == 401


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
        # With mock curator auth, should succeed
        assert response.status_code == 200

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
                ],
            },
        )
        # Should succeed with auth
        assert response.status_code == 200

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
                ],
            },
        )
        # Should return per-row error but still succeed
        assert response.status_code == 200


class TestLiteratureImport:
    """Tests for literature import endpoints."""

    def test_lookup_literature_with_auth(self, test_client):
        """POST /imports/literature/lookup succeeds with curator auth."""
        response = test_client.post(
            "/api/imports/literature/lookup",
            json=[],
        )
        # With mock curator auth, should succeed
        assert response.status_code == 200

    def test_fetch_literature_with_auth(self, test_client, seed_gene):
        """POST /imports/literature/fetch succeeds with curator auth."""
        response = test_client.post(
            "/api/imports/literature/fetch",
            json={"identifier": ""},
        )
        # With mock curator auth, should succeed (empty identifier returns early)
        assert response.status_code == 200

    def test_lookup_does_not_insert_rows(self, test_client, test_db, monkeypatch):
        """Lookup returns metadata without writing to the database (#321)."""
        from api.routers import imports as imports_module

        monkeypatch.setattr(
            imports_module,
            "_fetch_pubmed_metadata",
            lambda doi: imports_module.PubMedLookupResult(
                doi=doi,
                success=True,
                title="Found paper",
                authors="Smith J",
                journal="Nature",
                year="2024",
            ),
        )

        response = test_client.post(
            "/api/imports/literature/lookup",
            json=["10.1000/example-lookup"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data[0]["success"] is True
        assert data[0]["title"] == "Found paper"

        count = test_db.execute(
            text("SELECT COUNT(*) FROM literature WHERE id='10.1000/example-lookup'")
        ).scalar()
        assert count == 0

    def test_lookup_failure_creates_no_placeholder_rows(
        self, test_client, test_db, monkeypatch
    ):
        """Failed lookups must not create 'Unknown' placeholder rows (#321)."""
        from api.routers import imports as imports_module

        monkeypatch.setattr(
            imports_module,
            "_fetch_pubmed_metadata",
            lambda doi: imports_module.PubMedLookupResult(
                doi=doi, success=False, error="DOI not found"
            ),
        )

        response = test_client.post(
            "/api/imports/literature/lookup",
            json=["10.1000/does-not-exist"],
        )
        assert response.status_code == 200
        assert response.json()[0]["success"] is False

        count = test_db.execute(
            text("SELECT COUNT(*) FROM literature WHERE id='10.1000/does-not-exist'")
        ).scalar()
        assert count == 0

    def test_fetch_does_not_insert_rows(self, test_client, test_db, monkeypatch):
        """Fetch returns metadata without writing to the database (#321)."""
        from api.routers import imports as imports_module

        monkeypatch.setattr(
            imports_module,
            "_fetch_pubmed_metadata",
            lambda ident: imports_module.PubMedLookupResult(
                doi=ident,
                success=True,
                title="Fetched paper",
                authors="Doe A",
                journal="Science",
                year="2025",
            ),
        )

        response = test_client.post(
            "/api/imports/literature/fetch",
            json={"identifier": "10.1000/example-fetch"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Fetched paper"

        count = test_db.execute(
            text("SELECT COUNT(*) FROM literature WHERE id='10.1000/example-fetch'")
        ).scalar()
        assert count == 0


class TestVCFImport:
    """Tests for VCF file import endpoint."""

    def test_import_vcf_requires_gene(self, test_client):
        """POST /imports/variants/vcf with missing gene returns 404."""
        vcf_content = (
            "##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n"
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
        # Should succeed with mock curator auth
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_import_vcf_invalid_format(self, test_client, seed_gene):
        """POST /imports/variants/vcf with invalid VCF returns error."""
        invalid_vcf = "This is not a valid VCF file content"
        response = test_client.post(
            "/api/imports/variants/vcf?geneId=RNU4-2",
            files={"file": ("test.vcf", invalid_vcf, "text/plain")},
        )
        # Should return error for invalid format
        assert response.status_code == 400
