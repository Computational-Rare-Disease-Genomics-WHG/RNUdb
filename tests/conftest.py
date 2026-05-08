"""Pytest configuration and fixtures for RNUdb tests"""

# Add parent directory to path for imports
import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlmodel import Session as SQLModelSession
from sqlmodel import SQLModel

sys.path.insert(0, str(Path(__file__).parent.parent))


import api.models  # noqa: F401 - registers SQLModel table models
from api.main import app
from rnudb_utils.database import get_db

# Test database setup
TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine."""
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def test_db(test_engine) -> Generator[SQLModelSession, None, None]:
    """Provide a test database session."""
    connection = test_engine.connect()
    transaction = connection.begin()

    session = SQLModelSession(bind=connection)
    yield session

    session.close()
    transaction.rollback()
    connection.close()


# Mock authentication for tests
@pytest.fixture(autouse=True)
def mock_auth():
    """Override authentication dependencies for testing."""
    from api.routers.auth import require_admin, require_curator

    curator_user = {
        "github_login": "test_curator",
        "name": "Test Curator",
        "email": "test@example.com",
        "avatar_url": None,
        "role": "curator",
    }

    admin_user = {
        "github_login": "test_admin",
        "name": "Test Admin",
        "email": "admin@example.com",
        "avatar_url": None,
        "role": "admin",
    }

    # Override with mock - curator endpoints get curator, admin endpoints get admin
    app.dependency_overrides[require_curator] = lambda: curator_user
    app.dependency_overrides[require_admin] = lambda: admin_user

    yield

    # Restore original dependencies
    app.dependency_overrides.pop(require_curator, None)
    app.dependency_overrides.pop(require_admin, None)


@pytest.fixture
def seed_test_data(test_db):
    """Seed test data for approval and other tests."""
    from api.models import Gene, Variant

    gene = Gene(
        id="RNU4-2",
        name="RNU4-2",
        fullName="U4 spliceosomal RNA",
        chromosome="chr12",
        start=120291759,
        end=120291903,
        strand="+",
        sequence="ACGU",
        description="Test gene",
    )
    v_del = Variant(
        id="V-DEL-001",
        geneId="RNU4-2",
        position=120291764,
        ref="C",
        alt="T",
    )
    v_upd = Variant(
        id="V-UPD-001",
        geneId="RNU4-2",
        position=120291782,
        ref="A",
        alt="C",
    )
    test_db.add_all([gene, v_del, v_upd])
    test_db.commit()
    yield
    # Tables cleared by rollback in test_db fixture


@pytest.fixture
def test_client(test_db):
    """Create a FastAPI test client with the test database."""

    # Override the get_db dependency
    def get_test_db():
        return test_db

    app.dependency_overrides[get_db] = get_test_db

    client = TestClient(app)
    yield client

    # Clean up
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def seed_gene(test_db, sample_gene):
    """Insert sample gene into test database."""
    from api.models import Gene

    gene = Gene(**sample_gene)
    test_db.add(gene)
    test_db.commit()
    return gene


# ---------------------------------------------------------------------------
# Test data fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_gene():
    """Return a sample gene dictionary."""
    return {
        "id": "RNU4-2",
        "name": "RNU4-2",
        "fullName": "RNA, U4 small nuclear 2",
        "chromosome": "chr12",
        "start": 120291759,
        "end": 120291903,
        "strand": "-",
        "sequence": "tcagtctccgtagagactgtcaaaattgccaatgccgactatatttcaagtcgtcatggcgggttattgggaaaagttttcaattagcaataatcgcgcctcggataacctcattggctacgatactgccactgcgcaaagct",  # noqa: E501
        "description": "U4 small nuclear RNA involved in pre-mRNA splicing",
    }


@pytest.fixture
def valid_variant_rows():
    """Return valid variant rows for batch import testing."""
    return [
        {
            "position": 120291764,
            "ref": "C",
            "alt": "T",
            "hgvs": "n.140G>T",
        },
        {
            "position": 120291785,
            "ref": "T",
            "alt": "C",
            "hgvs": "n.119A>G",
        },
        {
            "position": 120291782,
            "ref": "A",
            "alt": "C",
            "hgvs": "n.122T>G",
            "function_score": -1.234,
            "cadd_score": 15.6,
        },
    ]


@pytest.fixture
def invalid_variant_rows():
    """Return invalid variant rows for validation testing."""
    return [
        {
            "position": 120291000,  # Out of bounds
            "ref": "C",
            "alt": "T",
        },
        {
            "position": 120291785,
            "ref": "X",  # Invalid nucleotide
            "alt": "T",
        },
    ]


@pytest.fixture
def valid_structure_data():
    """Return valid RNA structure data."""
    return {
        "id": "rnu4-2-test",
        "name": "Test Structure",
        "geneId": "RNU4-2",
        "nucleotides": [
            {"id": 1, "base": "A", "x": 100.0, "y": 100.0},
            {"id": 2, "base": "U", "x": 110.0, "y": 100.0},
            {"id": 3, "base": "G", "x": 120.0, "y": 100.0},
            {"id": 4, "base": "C", "x": 130.0, "y": 100.0},
        ],
        "base_pairs": [
            {"from_pos": 1, "to_pos": 4},
        ],
        "annotations": [],
        "structural_features": [],
    }


@pytest.fixture
def invalid_structure_data():
    """Return invalid RNA structure data."""
    return {
        "id": "invalid",
        "name": "Invalid",
        "geneId": "RNU4-2",
        "nucleotides": [
            {"id": 1, "x": 100.0, "y": 100.0},  # Missing base
        ],
        "base_pairs": [
            {"from_pos": 1, "to_pos": 99},  # Invalid nucleotide ID
        ],
    }


@pytest.fixture
def valid_bed_intervals():
    """Return valid BED intervals."""
    return [
        {
            "chrom": "12",
            "chromStart": 120291760,
            "chromEnd": 120291770,
            "name": "region1",
            "score": 500,
        },
        {
            "chrom": "12",
            "chromStart": 120291780,
            "chromEnd": 120291790,
            "name": "region2",
            "score": 800,
        },
        {
            "chrom": "12",
            "chromStart": 120291800,
            "chromEnd": 120291810,
            "name": "region3",
            "score": 200,
        },
    ]


@pytest.fixture
def invalid_bed_intervals():
    """Return invalid BED intervals."""
    return [
        {"chrom": "12", "chromStart": 120291770, "chromEnd": 120291760},  # start > end
        {
            "chrom": "11",
            "chromStart": 120291760,
            "chromEnd": 120291770,
        },  # Wrong chromosome
        {
            "chrom": "12",
            "chromStart": 120291000,
            "chromEnd": 120291010,
        },  # Out of bounds
        {
            "chrom": "12",
            "chromStart": 120291760,
            "chromEnd": 120291770,
            "score": 1500,
        },  # Score > 1000
    ]


# ---------------------------------------------------------------------------
# Variant Classification fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_literature():
    """Return a sample literature record for testing."""
    from api.models import Literature

    return Literature(
        id="10.1101/2025.08.13.25333306",
        title="Test Paper on Retinitis Pigmentosa",
        authors="Smith J, Doe A",
        journal="bioRxiv",
        year="2025",
        doi="10.1101/2025.08.13.25333306",
        pmid="12345678",
    )


@pytest.fixture
def sample_variant_with_data(test_db, sample_gene):
    """Return a variant with population data for testing."""
    from api.models import Variant

    variant = Variant(
        id="chr12-120291764-C-T",
        geneId="RNU4-2",
        position=120291764,
        ref="C",
        alt="T",
        gnomad_ac=5,
        gnomad_hom=0,
        aou_ac=37,
        aou_hom=0,
    )
    test_db.add(variant)
    test_db.commit()
    return variant


@pytest.fixture
def sample_variant_classification(test_db, sample_variant_with_data, sample_literature):
    """Return a sample variant classification for testing."""
    from api.models import VariantClassification

    test_db.add(sample_literature)
    test_db.commit()

    classification = VariantClassification(
        variant_id="chr12-120291764-C-T",
        literature_id="10.1101/2025.08.13.25333306",
        clinical_significance="VUS",
        zygosity="Heterozygous",
        disease="Retinitis Pigmentosa",
        counts=2,
        linked_variant_ids=None,
    )
    test_db.add(classification)
    test_db.commit()
    return classification


@pytest.fixture
def sample_import_payload():
    """Return sample import payload for testing."""
    return {
        "geneId": "RNU4-2",
        "variants": [
            {"position": 120291764, "ref": "C", "alt": "T", "hgvs": "n.140G>T"}
        ],
        "skip_invalid": True,
    }
