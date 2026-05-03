"""Pytest configuration and fixtures for RNUdb tests"""

# Add parent directory to path for imports
import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
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
def test_db(test_engine) -> Generator[Session, None, None]:
    """Provide a test database session."""
    connection = test_engine.connect()
    transaction = connection.begin()

    session = Session(bind=connection)
    yield session

    session.close()
    transaction.rollback()
    connection.close()


# Mock authentication for tests
@pytest.fixture(autouse=True)
def mock_auth():
    """Override authentication dependencies for testing."""
    from api.routers.auth import require_admin, require_curator

    test_user = {
        "github_login": "test_curator",
        "name": "Test Curator",
        "email": "test@example.com",
        "avatar_url": None,
        "role": "curator",
    }

    # Override with mock
    app.dependency_overrides[require_curator] = lambda: test_user
    app.dependency_overrides[require_admin] = lambda: test_user

    yield

    # Restore original dependencies
    app.dependency_overrides.pop(require_curator, None)
    app.dependency_overrides.pop(require_admin, None)


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
        "chromosome": "12",
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
            "clinical_significance": "VUS",
            "zygosity": "hom",
        },
        {
            "position": 120291785,
            "ref": "T",
            "alt": "C",
            "hgvs": "n.119A>G",
            "clinical_significance": "Pathogenic",
            "zygosity": "het",
        },
        {
            "position": 120291782,
            "ref": "A",
            "alt": "C",
            "hgvs": "n.122T>G",
            "clinical_significance": "Likely Pathogenic",
            "zygosity": "het",
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
            "clinical_significance": "VUS",
        },
        {
            "position": 120291785,
            "ref": "X",  # Invalid nucleotide
            "alt": "T",
            "clinical_significance": "Pathogenic",
        },
        {
            "position": 120291790,
            "ref": "G",
            "alt": "A",
            "clinical_significance": "Unknown",  # Invalid classification
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
