"""Database utility functions for RNUdb"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
import os


def get_database_path() -> Path:
    """Get the database path"""
    return Path(__file__).parent.parent / "data" / "database.db"


def get_db_connection() -> sqlite3.Connection:
    """Get database connection"""
    db_path = get_database_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This enables dict-like access to rows
    return conn


def create_database() -> sqlite3.Connection:
    """Create SQLite database with tables based on DATA_MODEL.md"""
    db_path = get_database_path()

    # Create data directory if it doesn't exist
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create SnRNAGene table
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

    # Create Variant table
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

    # Create Literature table
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

    # Create LiteratureCounts table
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

    # Create RNAStructure table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rna_structures (
        id TEXT PRIMARY KEY,
        geneId TEXT NOT NULL,
        FOREIGN KEY (geneId) REFERENCES genes(id)
    )
    """)

    # Create Nucleotides table
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

    # Create BasePairs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS base_pairs (
        structure_id TEXT,
        from_pos INTEGER,
        to_pos INTEGER,
        PRIMARY KEY (structure_id, from_pos, to_pos),
        FOREIGN KEY (structure_id) REFERENCES rna_structures(id)
    )
    """)

    # Create Annotations table
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

    # Create Structural Features table
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

    # Create Variant Links table for biallelic relationships
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

    conn.commit()

    # migrations helper: create users, audit_log if not exist
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
    
    # Create pending_changes table for curator approval workflow
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pending_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('gene', 'variant', 'literature', 'structure', 'bed_track')),
        entity_id TEXT,
        gene_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
        payload JSON NOT NULL,
        requested_by TEXT NOT NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        FOREIGN KEY (requested_by) REFERENCES users(github_login),
        FOREIGN KEY (reviewed_by) REFERENCES users(github_login)
    )
    """)
    return conn


def insert_genes(genes_data: List[Dict[str, Any]]) -> None:
    """Insert genes into the database

    Args:
        genes_data: List of gene dictionaries with keys:
            id, name, fullName, chromosome, start, end, sequence, description
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    for gene in genes_data:
        cursor.execute(
            """
            INSERT OR REPLACE INTO genes (id, name, fullName, chromosome, start, end, strand, sequence, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                gene["id"],
                gene["name"],
                gene["fullName"],
                gene["chromosome"],
                gene["start"],
                gene["end"],
                gene["strand"],
                gene["sequence"],
                gene["description"],
            ),
        )

    conn.commit()
    conn.close()


def insert_variants(variants_data: List[Dict[str, Any]]) -> None:
    """Insert variants into the database

    Args:
        variants_data: List of variant dictionaries with keys:
            id, geneId, position, nucleotidePosition, ref, alt, hgvs, consequence,
            clinvar_significance, clinical_significance, pmid, function_score,
            pvalues, qvalues, depletion_group, gnomad_ac, gnomad_hom,
            aou_ac, aou_hom, ukbb_ac, ukbb_hom, cadd_score, zygosity, cohort
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    for variant in variants_data:
        cursor.execute(
            """
            INSERT OR REPLACE INTO variants (
                id, geneId, position, nucleotidePosition, ref, alt, hgvs, consequence,
                clinvar_significance, clinical_significance, pmid, function_score,
                pvalues, qvalues, depletion_group, gnomad_ac, gnomad_hom,
                aou_ac, aou_hom, ukbb_ac, ukbb_hom, cadd_score, zygosity, cohort
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                variant["id"],
                variant["geneId"],
                variant["position"],
                variant.get("nucleotidePosition"),
                variant["ref"],
                variant["alt"],
                variant.get("hgvs"),
                variant.get("consequence"),
                variant.get("clinvar_significance"),
                variant.get("clinical_significance"),
                variant.get("pmid"),
                variant.get("function_score"),
                variant.get("pvalues"),
                variant.get("qvalues"),
                variant.get("depletion_group"),
                variant.get("gnomad_ac"),
                variant.get("gnomad_hom"),
                variant.get("aou_ac"),
                variant.get("aou_hom"),
                variant.get("ukbb_ac"),
                variant.get("ukbb_hom"),
                variant.get("cadd_score"),
                variant.get("zygosity"),
                variant.get("cohort"),
            ),
        )

    conn.commit()
    conn.close()


def insert_literature(literature_data: List[Dict[str, Any]]) -> None:
    """Insert literature into the database

    Args:
        literature_data: List of literature dictionaries with keys:
            id, title, authors, journal, year, doi
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert literature
    for lit in literature_data:
        cursor.execute(
            """
            INSERT OR REPLACE INTO literature (id, title, authors, journal, year, doi)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                lit["id"],
                lit["title"],
                lit["authors"],
                lit["journal"],
                lit["year"],
                lit["doi"],
            ),
        )

    conn.commit()
    conn.close()


def insert_literature_counts(literature_counts_data: List[Dict[str, Any]]) -> None:
    """Insert literature counts into the database

    Args:
        literature_counts_data: List of literature count dictionaries with keys:
            variant_id, literature_id, counts
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert literature counts
    for count in literature_counts_data:
        cursor.execute(
            """
            INSERT OR REPLACE INTO literature_counts (variant_id, literature_id, counts)
            VALUES (?, ?, ?)
        """,
            (
                count["variant_id"],
                count["literature_id"],
                count["counts"],
            ),
        )

    conn.commit()
    conn.close()


def insert_structures(structures_data: List[Dict[str, Any]]) -> None:
    """Insert RNA structures into the database

    Args:
        structures_data: List of structure dictionaries with keys:
            id, geneId, nucleotides, basePairs, annotations
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    for structure in structures_data:
        # Insert structure
        cursor.execute(
            """
            INSERT OR REPLACE INTO rna_structures (id, geneId)
            VALUES (?, ?)
        """,
            (structure["id"], structure["geneId"]),
        )

        structure_id = structure["id"]

        # Insert nucleotides
        for nucleotide in structure.get("nucleotides", []):
            cursor.execute(
                """
                INSERT OR REPLACE INTO nucleotides (id, structure_id, base, x, y)
                VALUES (?, ?, ?, ?, ?)
            """,
                (
                    nucleotide["id"],
                    structure_id,
                    nucleotide["base"],
                    nucleotide["x"],
                    nucleotide["y"],
                ),
            )

        # Insert base pairs
        for base_pair in structure.get("basePairs", []):
            cursor.execute(
                """
                INSERT OR REPLACE INTO base_pairs (structure_id, from_pos, to_pos)
                VALUES (?, ?, ?)
            """,
                (structure_id, base_pair["from"], base_pair["to"]),
            )

        # Insert annotations
        for annotation in structure.get("annotations", []):
            cursor.execute(
                """
                INSERT OR REPLACE INTO annotations (id, structure_id, text, x, y, fontSize, color)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    annotation["id"],
                    structure_id,
                    annotation["text"],
                    annotation["x"],
                    annotation["y"],
                    annotation["fontSize"],
                    annotation.get("color"),
                ),
            )

        # Insert structural features
        for feature in structure.get("structuralFeatures", []):
            import json

            nucleotide_ids_json = json.dumps(feature["nucleotideIds"])

            cursor.execute(
                """
                INSERT OR REPLACE INTO structural_features (
                    id, structure_id, feature_type, nucleotide_ids,
                    label_text, label_x, label_y, label_font_size, label_color,
                    description, color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    feature["id"],
                    structure_id,
                    feature["featureType"],
                    nucleotide_ids_json,
                    feature["label"]["text"],
                    feature["label"]["x"],
                    feature["label"]["y"],
                    feature["label"]["fontSize"],
                    feature["label"].get("color"),
                    feature.get("description"),
                    feature.get("color"),
                ),
            )

    conn.commit()
    conn.close()


def insert_variant_links(links_data: List[Dict[str, str]]) -> None:
    """Insert variant links into the database

    Args:
        links_data: List of link dictionaries with keys:
            variant_id_1, variant_id_2
            Note: variant_id_1 should be < variant_id_2 (lexicographically)
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    for link in links_data:
        # Ensure variant_id_1 < variant_id_2 to satisfy CHECK constraint
        vid1 = link["variant_id_1"]
        vid2 = link["variant_id_2"]
        if vid1 > vid2:
            vid1, vid2 = vid2, vid1

        cursor.execute(
            """
            INSERT OR REPLACE INTO variant_links (variant_id_1, variant_id_2)
            VALUES (?, ?)
        """,
            (vid1, vid2),
        )

    conn.commit()
    conn.close()


def get_linked_variants(variant_id: str) -> List[str]:
    """Get all variant IDs linked to the given variant

    Args:
        variant_id: The variant ID to look up

    Returns:
        List of linked variant IDs
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query both directions since we store ordered pairs
    cursor.execute(
        """
        SELECT variant_id_2 FROM variant_links WHERE variant_id_1 = ?
        UNION
        SELECT variant_id_1 FROM variant_links WHERE variant_id_2 = ?
    """,
        (variant_id, variant_id),
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        row["variant_id_2"] if "variant_id_2" in row.keys() else row["variant_id_1"]
        for row in rows
    ]


def get_user(github_login: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE github_login = ?", (github_login,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(github_login: str, name: str, email: str, avatar_url: str, role: str) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO users (github_login, name, email, avatar_url, role)
        VALUES (?, ?, ?, ?, ?)
        """,
        (github_login, name, email, avatar_url, role),
    )
    conn.commit()
    conn.close()


def update_user_role(github_login: str, role: str) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE github_login = ?",
        (role, github_login),
    )
    conn.commit()
    conn.close()


def list_pending_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE role = 'pending' ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def list_all_users(limit: int = 100) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def audit_log(table_name: str, record_id: str, action: str, old_values: Any, new_values: Any, user_login: str) -> None:
    import json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_login)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (table_name, record_id, action, json.dumps(old_values) if old_values else None, json.dumps(new_values) if new_values else None, user_login),
    )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    # Create database when run directly
    print("Creating database...")
    conn = create_database()
    conn.close()
    print(f"Database created successfully at {get_database_path()}")
