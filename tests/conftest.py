"""Pytest configuration and fixtures for RNUdb tests"""

import pytest
import sqlite3
from pathlib import Path

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.main import app
from fastapi.testclient import TestClient
from rnudb_utils.database import create_database, get_db_connection


# Mock authentication for tests
@pytest.fixture(autouse=True)
def mock_auth():
    """Override authentication dependencies for testing."""
    from api.routers.auth import require_curator, require_admin
    
    test_user = {
        "github_login": "test_curator",
        "name": "Test Curator",
        "email": "test@example.com",
        "avatar_url": None,
        "role": "curator"
    }
    
    # Store original dependencies
    original_curator = require_curator
    original_admin = require_admin
    
    # Override with mock
    app.dependency_overrides[require_curator] = lambda: test_user
    app.dependency_overrides[require_admin] = lambda: test_user
    
    yield
    
    # Restore original dependencies
    app.dependency_overrides.pop(require_curator, None)
    app.dependency_overrides.pop(require_admin, None)


def create_test_db(db_path=":memory:"):
    """Create an in-memory SQLite database with full schema for testing."""
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Create schema
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS genes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fullName TEXT NOT NULL,
        chromosome TEXT NOT NULL,
        start INTEGER NOT NULL,
        end INTEGER NOT NULL,
        strand TEXT NOT NULL,
        sequence TEXT NOT NULL,
        description TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS variants (
        id TEXT PRIMARY KEY,
        geneId TEXT NOT NULL,
        position INTEGER NOT NULL,
        nucleotidePosition INTEGER,
        ref TEXT NOT NULL,
        alt TEXT NOT NULL,
        hgvs TEXT,
        consequence TEXT,
        clinvar_significance TEXT,
        clinical_significance TEXT,
        pmid TEXT,
        function_score REAL,
        pvalues REAL,
        qvalues REAL,
        depletion_group TEXT,
        gnomad_ac INTEGER,
        gnomad_hom INTEGER,
        aou_ac INTEGER,
        aou_hom INTEGER,
        ukbb_ac INTEGER,
        ukbb_hom INTEGER,
        cadd_score REAL,
        zygosity TEXT,
        cohort TEXT,
        FOREIGN KEY (geneId) REFERENCES genes(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS literature (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        journal TEXT NOT NULL,
        year TEXT NOT NULL,
        doi TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS literature_counts (
        variant_id TEXT NOT NULL,
        literature_id TEXT NOT NULL,
        counts INTEGER NOT NULL,
        PRIMARY KEY (variant_id, literature_id),
        FOREIGN KEY (variant_id) REFERENCES variants(id),
        FOREIGN KEY (literature_id) REFERENCES literature(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rna_structures (
        id TEXT PRIMARY KEY,
        geneId TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS nucleotides (
        id INTEGER,
        structure_id TEXT,
        base TEXT NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        PRIMARY KEY (id, structure_id),
        FOREIGN KEY (structure_id) REFERENCES rna_structures(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS base_pairs (
        structure_id TEXT,
        from_pos INTEGER,
        to_pos INTEGER,
        PRIMARY KEY (structure_id, from_pos, to_pos),
        FOREIGN KEY (structure_id) REFERENCES rna_structures(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS annotations (
        id TEXT,
        structure_id TEXT,
        text TEXT NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        fontSize INTEGER NOT NULL,
        color TEXT,
        PRIMARY KEY (id, structure_id),
        FOREIGN KEY (structure_id) REFERENCES rna_structures(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS structural_features (
        id TEXT,
        structure_id TEXT,
        feature_type TEXT NOT NULL,
        nucleotide_ids TEXT NOT NULL,
        label_text TEXT NOT NULL,
        label_x REAL NOT NULL,
        label_y REAL NOT NULL,
        label_font_size INTEGER NOT NULL,
        label_color TEXT,
        description TEXT,
        color TEXT,
        PRIMARY KEY (id, structure_id),
        FOREIGN KEY (structure_id) REFERENCES rna_structures(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS variant_links (
        variant_id_1 TEXT NOT NULL,
        variant_id_2 TEXT NOT NULL,
        PRIMARY KEY (variant_id_1, variant_id_2),
        FOREIGN KEY (variant_id_1) REFERENCES variants(id),
        FOREIGN KEY (variant_id_2) REFERENCES variants(id),
        CHECK (variant_id_1 < variant_id_2)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        github_login TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        role TEXT CHECK(role IN ('guest','pending','curator','admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT,
        action TEXT CHECK(action IN ('CREATE','UPDATE','DELETE')),
        old_values JSON,
        new_values JSON,
        user_login TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bed_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        geneId TEXT NOT NULL,
        track_name TEXT NOT NULL,
        chrom TEXT NOT NULL,
        interval_start INTEGER NOT NULL,
        interval_end INTEGER NOT NULL,
        label TEXT,
        score REAL,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        FOREIGN KEY (geneId) REFERENCES genes(id)
    )
    """)
    
    # Insert test gene
    cursor.execute(
        """INSERT INTO genes (id, name, fullName, chromosome, start, end, strand, sequence, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        ("RNU4-2", "RNU4-2", "RNA, U4 small nuclear 2", "12", 120291759, 120291903, "-", 
         "tcagtctccgtagagactgtcaaaaattgccaatgccgactatatttcaagtcgtcatggcggggtattgggaaaagttttcaattagcaataatcgcgcctcggataaacctcattggctacgatactgccactgcgcaaagct",
         "U4 small nuclear RNA involved in pre-mRNA splicing")
    )
    
    conn.commit()
    return conn


@pytest.fixture
def test_client():
    """Create a FastAPI test client with the test database."""
    from fastapi.testclient import TestClient
    import tempfile
    import rnudb_utils.database as db_module
    import api.routers.imports as imports_module
    import api.routers.bed_tracks as bed_tracks_module
    import api.routers.genes as genes_module
    import api.routers.variants as variants_module
    import api.routers.literature as literature_module
    
    # Create temporary file database
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_path = db_file.name
    db_file.close()
    
    # Create schema in temp database
    test_db = create_test_db(db_path)
    test_db.close()
    
    # Monkeypatch get_db_connection to use temp file
    original_get_db = db_module.get_db_connection
    
    def mock_get_db():
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    db_module.get_db_connection = mock_get_db
    imports_module.get_db_connection = mock_get_db
    bed_tracks_module.get_db_connection = mock_get_db
    genes_module.get_db_connection = mock_get_db
    variants_module.get_db_connection = mock_get_db
    literature_module.get_db_connection = mock_get_db
    
    client = TestClient(app)
    yield client
    
    # Restore
    db_module.get_db_connection = original_get_db
    imports_module.get_db_connection = original_get_db
    bed_tracks_module.get_db_connection = original_get_db
    genes_module.get_db_connection = original_get_db
    variants_module.get_db_connection = original_get_db
    literature_module.get_db_connection = original_get_db
    
    # Clean up temp file
    import os
    os.unlink(db_path)


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
        "sequence": "tcagtctccgtagagactgtcaaaaattgccaatgccgactatatttcaagtcgtcatggcggggtattgggaaaagttttcaattagcaataatcgcgcctcggataaacctcattggctacgatactgccactgcgcaaagct",
        "description": "U4 small nuclear RNA involved in pre-mRNA splicing"
    }


@pytest.fixture
def valid_variant_rows():
    """Return valid variant rows for batch import testing."""
    return [
        {
            "position": 120291764,
            "ref": "C",
            "alt": "T",
            "hgvs": "n.140G>A",
            "clinical_significance": "VUS",
            "zygosity": "hom"
        },
        {
            "position": 120291785,
            "ref": "T",
            "alt": "C",
            "hgvs": "n.119A>G",
            "clinical_significance": "Pathogenic",
            "zygosity": "het"
        },
        {
            "position": 120291782,
            "ref": "A",
            "alt": "C",
            "hgvs": "n.122T>G",
            "clinical_significance": "Likely Pathogenic",
            "zygosity": "het",
            "function_score": -1.234,
            "cadd_score": 15.6
        }
    ]


@pytest.fixture
def invalid_variant_rows():
    """Return invalid variant rows for validation testing."""
    return [
        {
            "position": 120291000,  # Out of bounds
            "ref": "C",
            "alt": "T",
            "clinical_significance": "VUS"
        },
        {
            "position": 120291785,
            "ref": "X",  # Invalid nucleotide
            "alt": "T",
            "clinical_significance": "Pathogenic"
        },
        {
            "position": 120291790,
            "ref": "G",
            "alt": "A",
            "clinical_significance": "Unknown"  # Invalid classification
        }
    ]


@pytest.fixture
def valid_structure_data():
    """Return valid RNA structure data."""
    return {
        "id": "rnu4-2-test",
        "geneId": "RNU4-2",
        "name": "RNU4-2 Test Structure",
        "nucleotides": [
            {"id": 1, "base": "A", "x": 100.0, "y": 100.0},
            {"id": 2, "base": "U", "x": 110.0, "y": 100.0},
            {"id": 3, "base": "G", "x": 120.0, "y": 100.0},
            {"id": 4, "base": "C", "x": 130.0, "y": 100.0},
        ],
        "basePairs": [
            {"from": 1, "to": 4}
        ],
        "annotations": [],
        "structuralFeatures": []
    }


@pytest.fixture
def invalid_structure_data():
    """Return invalid RNA structure data."""
    return {
        "id": "invalid",
        "name": "Invalid Structure",
        "nucleotides": [
            {"id": 1, "x": 100.0, "y": 100.0}  # Missing base
        ],
        "basePairs": [
            {"from": 1, "to": 99}  # Invalid nucleotide ID
        ]
    }


@pytest.fixture
def valid_bed_intervals():
    """Return valid BED intervals."""
    return [
        {"chrom": "12", "chromStart": 120291760, "chromEnd": 120291770, "name": "region1", "score": 500},
        {"chrom": "12", "chromStart": 120291780, "chromEnd": 120291790, "name": "region2", "score": 800},
        {"chrom": "12", "chromStart": 120291800, "chromEnd": 120291810, "name": "region3", "score": 200},
    ]


@pytest.fixture
def invalid_bed_intervals():
    """Return invalid BED intervals."""
    return [
        {"chrom": "12", "chromStart": 120291770, "chromEnd": 120291760},  # start > end
        {"chrom": "11", "chromStart": 120291760, "chromEnd": 120291770},  # Wrong chromosome
        {"chrom": "12", "chromStart": 120291000, "chromEnd": 120291010},  # Out of bounds
        {"chrom": "12", "chromStart": 120291760, "chromEnd": 120291770, "score": 1500},  # Score > 1000
    ]
