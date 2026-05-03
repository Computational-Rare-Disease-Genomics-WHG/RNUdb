#!/usr/bin/env python3
"""Insert RNU4-2 gene and structure data into database"""

import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from rnudb_utils.database import insert_genes, insert_structures


def transform_structure_keys(data):
    """Transform camelCase keys to snake_case for structure data."""
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            new_key = k.replace('basePairs', 'base_pairs').replace('structuralFeatures', 'structural_features')
            new_dict[new_key] = transform_structure_keys(v)
        return new_dict
    elif isinstance(data, list):
        return [transform_structure_keys(item) for item in data]
    return data


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
            "sequence": "tcagtctccgtagagactgtcaaaattgccaatgccgactatatttcaagtcgtcatggcggggtattgggaaaagttttcaattagcaataatcgcgcctcggataaacctcattggctacgatactgccactgcgcaaagct",
            "description": "U4 small nuclear RNA involved in pre-mRNA splicing as part of the spliceosome complex. Binds to U6 snRNA to form the U4/U6 di-snRNP complex.",
        }
    ]

    print(f"Inserting {len(genes_data)} gene(s)...")
    insert_genes(genes_data)
    print("Genes inserted successfully!")

    # Check if structure file exists
    structure_file = Path(__file__).parent.parent / "data" / "rnu4-2" / "structure.json"
    if structure_file.exists():
        print(f"\nLoading structure from {structure_file}...")
        with open(structure_file) as f:
            structure_data = json.load(f)

        # Transform camelCase keys to snake_case
        structure_data = transform_structure_keys(structure_data)

        print("Inserting RNA structure...")
        insert_structures([structure_data])
        print("Structure inserted successfully!")
    else:
        print(f"\nWarning: Structure file not found at {structure_file}")
        print("Skipping structure insertion.")

    print("\nDone!")


if __name__ == "__main__":
    main()
