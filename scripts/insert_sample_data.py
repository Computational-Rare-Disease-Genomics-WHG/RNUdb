#!/usr/bin/env python3
"""Insert sample data into RNUdb database"""

import sys
from pathlib import Path

import pandas as pd
from pprint import pprint

# Add parent directory to path to import rnudb_utils
sys.path.insert(0, str(Path(__file__).parent.parent))

from rnudb_utils import (
    insert_genes,
    insert_variants,
    insert_literature,
    insert_structures,
    query_gnomad_variants,
    query_all_of_us_variants,
)


def insert_sample_genes():
    """Insert sample gene data"""
    genes_data = [
        {
            "id": "RNU4-2",
            "name": "RNU4-2",
            "fullName": "RNA, U4 small nuclear 2",
            "chromosome": "12",
            "start": 120291759,
            "end": 120291903,
            "sequence": "tcagtctccgtagagactgtcaaaaattgccaatgccgactatatttcaagtcgtcatggcggggtattgggaaaagttttcaattagcaataatcgcgcctcggataaacctcattggctacgatactgccactgcgcaaagct",
            "description": "U4 small nuclear RNA involved in pre-mRNA splicing as part of the spliceosome complex. Binds to U6 snRNA to form the U4/U6 di-snRNP complex.",
        }
    ]

    print(f"Inserting {len(genes_data)} sample genes...")
    insert_genes(genes_data)
    print("Sample genes inserted successfully!")


def insert_sample_variants():
    """Insert variant data merged from gnomAD, All of Us, and SGE data"""
    # Query RNU4-2 region: chr12:120291759-120291903
    print("Querying gnomAD variants...")
    gnomad_variants = query_gnomad_variants("12", 120291759, 120291903)
    
    print("Querying All of Us variants...")
    aou_variants = query_all_of_us_variants("12", 120291759, 120291903)
    
    # Load SGE data
    print("Loading SGE data...")
    sge_file_path = Path(__file__).parent.parent / "data" / "rnu4-2" / "rnu4-2_sge.txt"
    sge_df = pd.read_csv(sge_file_path, sep='\t')
    
    # Create unified variant dictionary
    all_variants = {}
    
    # Process gnomAD variants
    for variant in gnomad_variants:
        key = f"{variant['position']}-{variant['ref']}-{variant['alt']}"
        all_variants[key] = {
            'position': variant['position'],
            'ref': variant['ref'],
            'alt': variant['alt'],
            'variant_id': variant.get('variant_id'),
            'rsids': variant.get('rsids', []),
            'consequence': variant.get('consequence'),
            'gnomad_ac': variant.get('gnomad_ac'),
            'gnomad_hom': variant.get('gnomad_hom'),
            'aou_ac': None,
            'aou_hom': None,
            'ukbb_ac': None,
            'ukbb_hom': None,
            'function_score': None,
            'pvalues': None,
            'qvalues': None,
            'depletion_group': None,
            'cadd_score': None,
            'hgvs': None,
            'clinical_significance': None
        }
    
    # Process All of Us variants
    for variant in aou_variants:
        if variant['position'] and variant['ref'] and variant['alt']:
            key = f"{variant['position']}-{variant['ref']}-{variant['alt']}"
            if key not in all_variants:
                all_variants[key] = {
                    'position': variant['position'],
                    'ref': variant['ref'],
                    'alt': variant['alt'],
                    'variant_id': variant.get('variant_id'),
                    'rsids': [],
                    'consequence': variant.get('consequence'),
                    'gnomad_ac': None,
                    'gnomad_hom': None,
                    'aou_ac': variant.get('aou_ac'),
                    'aou_hom': variant.get('aou_hom'),
                    'ukbb_ac': None,
                    'ukbb_hom': None,
                    'function_score': None,
                    'pvalues': None,
                    'qvalues': None,
                    'depletion_group': None,
                    'cadd_score': None,
                    'hgvs': None,
                    'clinical_significance': variant.get('clinical_significance')
                }
            else:
                # Update existing variant with All of Us data
                all_variants[key]['aou_ac'] = variant.get('aou_ac')
                all_variants[key]['aou_hom'] = variant.get('aou_hom')
                if variant.get('clinical_significance'):
                    all_variants[key]['clinical_significance'] = variant.get('clinical_significance')
    
    # Process SGE data
    for _, row in sge_df.iterrows():
        # Parse position from ID (format: chr12-120291903-T-G)
        id_parts = row['ID'].split('-')
        if len(id_parts) >= 4:
            position = int(id_parts[1])
            ref = id_parts[2]
            alt = id_parts[3]
            key = f"{position}-{ref}-{alt}"
            
            if key not in all_variants:
                all_variants[key] = {
                    'position': position,
                    'ref': ref,
                    'alt': alt,
                    'variant_id': row['ID'],
                    'rsids': [],
                    'consequence': None,
                    'gnomad_ac': None,
                    'gnomad_hom': None,
                    'aou_ac': None,
                    'aou_hom': None,
                    'ukbb_ac': None,
                    'ukbb_hom': None,
                    'function_score': None,
                    'pvalues': None,
                    'qvalues': None,
                    'depletion_group': None,
                    'cadd_score': None,
                    'hgvs': None,
                    'clinical_significance': None
                }
            
            # Update with SGE data (ignore AoU and UKBiobank fields from SGE as requested)
            all_variants[key]['function_score'] = row.get('function_score') if pd.notna(row.get('function_score')) else None
            all_variants[key]['pvalues'] = row.get('pvalues') if pd.notna(row.get('pvalues')) else None
            all_variants[key]['qvalues'] = row.get('qvalues') if pd.notna(row.get('qvalues')) else None
            all_variants[key]['depletion_group'] = row.get('depletion_group') if pd.notna(row.get('depletion_group')) else None
            all_variants[key]['cadd_score'] = row.get('CADD_score') if pd.notna(row.get('CADD_score')) else None
            all_variants[key]['hgvs'] = row.get('HGVS') if pd.notna(row.get('HGVS')) else None
    
    # Convert to database format
    variants_data = []
    for key, variant in all_variants.items():
        # Calculate nucleotide position relative to gene start (120291759)
        nucleotide_position = variant['position'] - 120291759 + 1 if variant['position'] else None
        
        # Generate unique ID if not available
        variant_id = variant.get('variant_id')
        if not variant_id:
            if variant.get('rsids'):
                variant_id = variant['rsids'][0]
            else:
                variant_id = f"chr12_{variant['position']}_{variant['ref']}_{variant['alt']}"
        
        variants_data.append({
            "id": variant_id,
            "geneId": "RNU4-2",
            "position": variant['position'],
            "nucleotidePosition": nucleotide_position,
            "ref": variant['ref'],
            "alt": variant['alt'],
            "hgvs": variant['hgvs'],
            "consequence": variant['consequence'],
            "clinvar_significance": None,  # Not available in current data
            "clinical_significance": variant['clinical_significance'],
            "pmid": None,  # Not available in current data
            "function_score": variant['function_score'],
            "pvalues": variant['pvalues'],
            "qvalues": variant['qvalues'],
            "depletion_group": variant['depletion_group'],
            "gnomad_ac": variant['gnomad_ac'],
            "gnomad_hom": variant['gnomad_hom'],
            "aou_ac": variant['aou_ac'],
            "aou_hom": variant['aou_hom'],
            "ukbb_ac": variant['ukbb_ac'],
            "ukbb_hom": variant['ukbb_hom'],
            "cadd_score": variant['cadd_score']
        })
    
    print(f"Found {len(gnomad_variants)} gnomAD variants")
    print(f"Found {len(aou_variants)} All of Us variants")
    print(f"Found {len(sge_df)} SGE variants")
    print(f"Merged into {len(variants_data)} unique variants")
    
    print(f"Inserting {len(variants_data)} merged variants...")
    insert_variants(variants_data)
    print("Merged variants inserted successfully!")


def insert_sample_literature():
    """Insert sample literature data"""
    literature_data = [
        {
            "pmid": "12345678",
            "title": "Structural analysis of U4 snRNA and its role in pre-mRNA splicing",
            "authors": "Smith, J. et al.",
            "journal": "Nature Structural Biology",
            "year": "2023",
            "doi": "10.1038/nsb.2023.001",
            "abstract": "Comprehensive structural analysis of U4 snRNA reveals critical base-pairing interactions with U6 snRNA and their role in spliceosome assembly. The study identifies key functional domains and provides insights into disease-associated variants.",
        },
        {
            "pmid": "23456789",
            "title": "U4/U6 di-snRNP structure and function in human cells",
            "authors": "Johnson, M. et al.",
            "journal": "Cell",
            "year": "2022",
            "doi": "10.1016/j.cell.2022.05.012",
            "abstract": "Cryo-EM analysis of the human U4/U6 di-snRNP complex reveals the molecular architecture and provides mechanistic insights into spliceosome activation. The study identifies novel protein-RNA interactions.",
        },
        {
            "pmid": "34567890",
            "title": "Genetic variants in small nuclear RNAs and their association with rare diseases",
            "authors": "Williams, R. et al.",
            "journal": "American Journal of Human Genetics",
            "year": "2021",
            "doi": "10.1016/j.ajhg.2021.08.009",
            "abstract": "Systematic analysis of genetic variants in snRNA genes reveals their contribution to rare developmental disorders. The study identifies pathogenic variants in multiple snRNA genes including RNU4-2.",
        },
    ]

    literature_gene_associations = [
        {"pmid": "12345678", "gene_id": "RNU4-2"},
        {"pmid": "23456789", "gene_id": "RNU4-2"},
        {"pmid": "34567890", "gene_id": "RNU4-2"},
    ]

    print(f"Inserting {len(literature_data)} sample literature entries...")
    insert_literature(literature_data, literature_gene_associations)
    print("Sample literature inserted successfully!")


def insert_sample_structures():
    """Insert RNA structure data from structure.json"""
    import json
    
    # Load structure data from file
    print("Loading structure data...")
    structure_file_path = Path(__file__).parent.parent / "data" / "rnu4-2" / "structure.json"
    
    with open(structure_file_path, 'r') as f:
        structure_data = json.load(f)
    
    # Prepare structure for insertion
    structures_data = [{
        "id": "rnu4-2_structure",
        "geneId": "RNU4-2",
        "nucleotides": structure_data.get("nucleotides", []),
        "basePairs": structure_data.get("basePairs", []),
        "annotations": structure_data.get("annotations", []),
        "structuralFeatures": structure_data.get("structuralFeatures", [])
    }]

    print(f"Loading structure with {len(structure_data.get('nucleotides', []))} nucleotides, {len(structure_data.get('basePairs', []))} base pairs, {len(structure_data.get('annotations', []))} annotations, and {len(structure_data.get('structuralFeatures', []))} structural features...")
    insert_structures(structures_data)
    print("RNA structure inserted successfully!")


def main():
    """Insert all sample data"""
    print("Starting sample data insertion...")

    insert_sample_genes()
    insert_sample_variants()
    insert_sample_literature()
    insert_sample_structures()

    print("All sample data inserted successfully!")


if __name__ == "__main__":
    main()
