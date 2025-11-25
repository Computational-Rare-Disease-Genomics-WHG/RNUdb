#!/usr/bin/env python3
"""Insert RNU4-2 gene and structure data into database"""

import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import directly from database module file to avoid __init__.py dependencies
import importlib.util
spec = importlib.util.spec_from_file_location("database", Path(__file__).parent.parent / "rnudb_utils" / "database.py")
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)


def main():
    """Insert gene and structure data for RNU4-2"""

    # Gene data
    genes_data = [
        {
            "id": "RNU4-2",
            "name": "RNU4-2",
            "fullName": "RNA, U4 small nuclear 2",
            "chromosome": "12",
            "start": 120291759,
            "end": 120291903,
            "strand": "-",
            "sequence": "tcagtctccgtagagactgtcaaaaattgccaatgccgactatatttcaagtcgtcatggcggggtattgggaaaagttttcaattagcaataatcgcgcctcggataaacctcattggctacgatactgccactgcgcaaagct",
            "description": "U4 small nuclear RNA involved in pre-mRNA splicing as part of the spliceosome complex. Binds to U6 snRNA to form the U4/U6 di-snRNP complex.",
        }
    ]

    print(f"Inserting {len(genes_data)} gene(s)...")
    db.insert_genes(genes_data)
    print("Genes inserted successfully!")

    # Check if structure file exists
    structure_file = Path(__file__).parent.parent / "data" / "rnu4-2" / "structure.json"
    if structure_file.exists():
        print(f"\nLoading structure from {structure_file}...")
        with open(structure_file, 'r') as f:
            structure_data = json.load(f)

        print("Inserting RNA structure...")
        db.insert_structures([structure_data])
        print("Structure inserted successfully!")
    else:
        print(f"\nWarning: Structure file not found at {structure_file}")
        print("Skipping structure insertion.")

    print("\nDone!")


if __name__ == "__main__":
    main()
