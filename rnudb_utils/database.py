"""Database utility functions for RNUdb"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional


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
        FOREIGN KEY (geneId) REFERENCES genes(id)
    )
    """)

    # Create Literature table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS literature (
        pmid TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        journal TEXT NOT NULL,
        year TEXT NOT NULL,
        doi TEXT,
        abstract TEXT NOT NULL
    )
    """)

    # Create Literature-Gene association table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS literature_genes (
        pmid TEXT,
        gene_id TEXT,
        PRIMARY KEY (pmid, gene_id),
        FOREIGN KEY (pmid) REFERENCES literature(pmid),
        FOREIGN KEY (gene_id) REFERENCES genes(id)
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

    conn.commit()
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
        cursor.execute("""
            INSERT OR REPLACE INTO genes (id, name, fullName, chromosome, start, end, sequence, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            gene['id'], gene['name'], gene['fullName'], gene['chromosome'],
            gene['start'], gene['end'], gene['sequence'], gene['description']
        ))
    
    conn.commit()
    conn.close()


def insert_variants(variants_data: List[Dict[str, Any]]) -> None:
    """Insert variants into the database
    
    Args:
        variants_data: List of variant dictionaries with keys:
            id, geneId, position, nucleotidePosition, ref, alt, hgvs, consequence,
            clinvar_significance, clinical_significance, pmid, function_score,
            pvalues, qvalues, depletion_group, gnomad_ac, gnomad_hom,
            aou_ac, aou_hom, ukbb_ac, ukbb_hom, cadd_score
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for variant in variants_data:
        cursor.execute("""
            INSERT OR REPLACE INTO variants (
                id, geneId, position, nucleotidePosition, ref, alt, hgvs, consequence,
                clinvar_significance, clinical_significance, pmid, function_score,
                pvalues, qvalues, depletion_group, gnomad_ac, gnomad_hom,
                aou_ac, aou_hom, ukbb_ac, ukbb_hom, cadd_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            variant['id'], variant['geneId'], variant['position'], 
            variant.get('nucleotidePosition'), variant['ref'], variant['alt'], 
            variant.get('hgvs'), variant.get('consequence'),
            variant.get('clinvar_significance'), variant.get('clinical_significance'), 
            variant.get('pmid'), variant.get('function_score'),
            variant.get('pvalues'), variant.get('qvalues'), 
            variant.get('depletion_group'), variant.get('gnomad_ac'), 
            variant.get('gnomad_hom'), variant.get('aou_ac'), 
            variant.get('aou_hom'), variant.get('ukbb_ac'), 
            variant.get('ukbb_hom'), variant.get('cadd_score')
        ))
    
    conn.commit()
    conn.close()


def insert_literature(literature_data: List[Dict[str, Any]], 
                     literature_gene_associations: Optional[List[Dict[str, str]]] = None) -> None:
    """Insert literature into the database
    
    Args:
        literature_data: List of literature dictionaries with keys:
            pmid, title, authors, journal, year, doi, abstract
        literature_gene_associations: Optional list of associations with keys:
            pmid, gene_id
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert literature
    for lit in literature_data:
        cursor.execute("""
            INSERT OR REPLACE INTO literature (pmid, title, authors, journal, year, doi, abstract)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            lit['pmid'], lit['title'], lit['authors'], lit['journal'],
            lit['year'], lit.get('doi'), lit['abstract']
        ))
    
    # Insert literature-gene associations
    if literature_gene_associations:
        for assoc in literature_gene_associations:
            cursor.execute("""
                INSERT OR REPLACE INTO literature_genes (pmid, gene_id)
                VALUES (?, ?)
            """, (assoc['pmid'], assoc['gene_id']))
    
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
        cursor.execute("""
            INSERT OR REPLACE INTO rna_structures (id, geneId)
            VALUES (?, ?)
        """, (structure['id'], structure['geneId']))
        
        structure_id = structure['id']
        
        # Insert nucleotides
        for nucleotide in structure.get('nucleotides', []):
            cursor.execute("""
                INSERT OR REPLACE INTO nucleotides (id, structure_id, base, x, y)
                VALUES (?, ?, ?, ?, ?)
            """, (
                nucleotide['id'], structure_id, nucleotide['base'],
                nucleotide['x'], nucleotide['y']
            ))
        
        # Insert base pairs
        for base_pair in structure.get('basePairs', []):
            cursor.execute("""
                INSERT OR REPLACE INTO base_pairs (structure_id, from_pos, to_pos)
                VALUES (?, ?, ?)
            """, (structure_id, base_pair['from'], base_pair['to']))
        
        # Insert annotations
        for annotation in structure.get('annotations', []):
            cursor.execute("""
                INSERT OR REPLACE INTO annotations (id, structure_id, text, x, y, fontSize, color)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                annotation['id'], structure_id, annotation['text'],
                annotation['x'], annotation['y'], annotation['fontSize'],
                annotation.get('color')
            ))
    
    conn.commit()
    conn.close()


if __name__ == "__main__":
    # Create database when run directly
    print("Creating database...")
    conn = create_database()
    conn.close()
    print(f"Database created successfully at {get_database_path()}")