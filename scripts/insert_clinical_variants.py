"""Insert curated clinical variants from TSV file into RNUdb database"""

import csv
import sys
from pathlib import Path
from collections import defaultdict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import directly from database module file to avoid __init__.py dependencies
import importlib.util
spec = importlib.util.spec_from_file_location("database", Path(__file__).parent.parent / "rnudb_utils" / "database.py")
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)
insert_variants = db.insert_variants
insert_variant_links = db.insert_variant_links


def parse_variant_string(variant_str: str) -> dict:
    """Parse variant string like 'chr12-120291785-T-C' into components

    Args:
        variant_str: Variant string in format chr{chr}-{pos}-{ref}-{alt}

    Returns:
        Dictionary with chr, position, ref, alt
    """
    # Handle both colon and hyphen formats
    if ':' in variant_str:
        # Format: chr12:120291775:CTG:C
        parts = variant_str.split(':')
        if len(parts) == 4:
            chr_part = parts[0].replace('chr', '')
            return {
                'chr': chr_part,
                'position': int(parts[1]),
                'ref': parts[2],
                'alt': parts[3]
            }
    else:
        # Format: chr12-120291785-T-C
        parts = variant_str.split('-')
        if len(parts) >= 4:
            chr_part = parts[0].replace('chr', '')
            return {
                'chr': chr_part,
                'position': int(parts[1]),
                'ref': parts[2],
                'alt': parts[3]
            }

    raise ValueError(f"Cannot parse variant string: {variant_str}")


def load_clinical_variants():
    """Load clinical variants from TSV file and insert into database"""

    tsv_path = Path(__file__).parent.parent / "data" / "clinical_variants.tsv"

    if not tsv_path.exists():
        print(f"Error: {tsv_path} not found")
        return

    # Gene ID and coordinates for RNU4-2
    gene_id = "RNU4-2"
    gene_start = 120291759  # Genomic start position
    gene_end = 120291903    # Genomic end position

    # Parse TSV file
    variants_by_individual = defaultdict(list)
    all_variants = {}  # variant_id -> variant_dict

    with open(tsv_path, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')

        for row in reader:
            individual = row['individual']
            cohort = row['cohort']
            variant_str = row['variant']
            zygosity = row['zygosity']
            hgvs = row['hgvs']
            acmg = row['acmg']

            # Parse variant components
            try:
                variant_parts = parse_variant_string(variant_str)
            except ValueError as e:
                print(f"Warning: {e}")
                continue

            # Create variant ID
            variant_id = f"{gene_id}-{variant_str}"

            # Calculate nucleotidePosition (1-based position in RNA sequence)
            # Convert genomic position to nucleotide position
            genomic_pos = variant_parts['position']
            nucleotide_pos = genomic_pos - gene_start + 1 if gene_start <= genomic_pos <= gene_end else None

            # Create variant dictionary
            variant_dict = {
                'id': variant_id,
                'geneId': gene_id,
                'position': variant_parts['position'],
                'nucleotidePosition': nucleotide_pos,
                'ref': variant_parts['ref'],
                'alt': variant_parts['alt'],
                'hgvs': hgvs,
                'consequence': None,
                'clinvar_significance': None,
                'clinical_significance': acmg,  # Use ACMG classification
                'pmid': None,
                'function_score': None,
                'pvalues': None,
                'qvalues': None,
                'depletion_group': None,
                'gnomad_ac': None,
                'gnomad_hom': None,
                'aou_ac': None,
                'aou_hom': None,
                'ukbb_ac': None,
                'ukbb_hom': None,
                'cadd_score': None,
                'zygosity': zygosity,
                'cohort': cohort
            }

            # Store variant
            all_variants[variant_id] = variant_dict

            # Group by individual
            variants_by_individual[individual].append(variant_id)

    # Insert all unique variants
    print(f"Inserting {len(all_variants)} unique variants...")
    variants_list = list(all_variants.values())
    insert_variants(variants_list)
    print("Variants inserted successfully")

    # Create links for individuals with multiple variants (compound heterozygous)
    links = []
    for individual, variant_ids in variants_by_individual.items():
        if len(variant_ids) >= 2:
            # Create all pairwise links
            for i in range(len(variant_ids)):
                for j in range(i + 1, len(variant_ids)):
                    vid1 = variant_ids[i]
                    vid2 = variant_ids[j]

                    # Ensure ordering for CHECK constraint
                    if vid1 > vid2:
                        vid1, vid2 = vid2, vid1

                    links.append({
                        'variant_id_1': vid1,
                        'variant_id_2': vid2
                    })

            print(f"Individual {individual}: linking {len(variant_ids)} variants")

    # Insert variant links
    if links:
        print(f"\nInserting {len(links)} variant links...")
        insert_variant_links(links)
        print("Variant links inserted successfully")
    else:
        print("\nNo compound heterozygous variants found (all homozygous)")

    # Summary
    print(f"\n=== Summary ===")
    print(f"Total unique variants: {len(all_variants)}")
    print(f"Individuals: {len(variants_by_individual)}")
    print(f"Variant links: {len(links)}")

    # Show some statistics
    hom_count = sum(1 for v in all_variants.values() if v['zygosity'] == 'hom')
    het_count = sum(1 for v in all_variants.values() if v['zygosity'] == 'het')
    print(f"Homozygous variants: {hom_count}")
    print(f"Heterozygous variants: {het_count}")

    # Show ACMG classification distribution
    acmg_counts = defaultdict(int)
    for v in all_variants.values():
        acmg_counts[v['clinical_significance']] += 1
    print(f"\nACMG classifications:")
    for acmg, count in sorted(acmg_counts.items()):
        print(f"  {acmg}: {count}")


if __name__ == "__main__":
    print("Loading curated clinical variants...")
    load_clinical_variants()
    print("\nDone!")
