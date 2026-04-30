"""Insert curated clinical variants from VCF file into RNUdb database"""

import sys
from pathlib import Path
from collections import defaultdict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import directly from database module file to avoid __init__.py dependencies
import importlib.util

spec = importlib.util.spec_from_file_location(
    "database", Path(__file__).parent.parent / "rnudb_utils" / "database.py"
)
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)
insert_variants = db.insert_variants
insert_variant_links = db.insert_variant_links
insert_literature = db.insert_literature
insert_literature_counts = db.insert_literature_counts


def parse_variant_string(variant_str: str) -> dict:
    """Parse variant string like 'chr12-120291785-T-C' into components

    Args:
        variant_str: Variant string in format chr{chr}-{pos}-{ref}-{alt}

    Returns:
        Dictionary with chr, position, ref, alt
    """
    # Handle both colon and hyphen formats
    if ":" in variant_str:
        # Format: chr12:120291775:CTG:C
        parts = variant_str.split(":")
        if len(parts) == 4:
            chr_part = parts[0].replace("chr", "")
            return {
                "chr": chr_part,
                "position": int(parts[1]),
                "ref": parts[2],
                "alt": parts[3],
            }
    else:
        # Format: chr12-120291785-T-C
        parts = variant_str.split("-")
        if len(parts) >= 4:
            chr_part = parts[0].replace("chr", "")
            return {
                "chr": chr_part,
                "position": int(parts[1]),
                "ref": parts[2],
                "alt": parts[3],
            }

    raise ValueError(f"Cannot parse variant string: {variant_str}")


def parse_vcf_info(info_str):
    """Parse VCF INFO field into a dictionary"""
    info_dict = {}
    if not info_str or info_str == ".":
        return info_dict

    for item in info_str.split(";"):
        if "=" in item:
            key, value = item.split("=", 1)
            info_dict[key] = value
        else:
            info_dict[item] = True
    return info_dict


def load_clinical_variants():
    """Load clinical variants from VCF file and insert into database"""

    vcf_path = Path(__file__).parent.parent / "data" / "rnu4-2" / "variants.vcf"

    if not vcf_path.exists():
        print(f"Error: {vcf_path} not found")
        return

    # Gene ID and coordinates for RNU4-2
    gene_id = "RNU4-2"
    gene_start = 120291759  # Genomic start position
    gene_end = 120291903  # Genomic end position

    # Parse VCF file
    all_variants = {}  # variant_id -> variant_dict
    literature_counts_data = []  # Will collect literature counts

    with open(vcf_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#"):
                continue  # Skip header lines

            fields = line.split("\t")
            if len(fields) < 8:
                continue

            chrom, pos, var_id, ref, alt, qual, filter_field, info_str = fields[:8]

            # Parse INFO field
            info = parse_vcf_info(info_str)

            # Extract variant information
            position = int(pos)
            hgvs = info.get("HGVS", "")
            clinvar_sig = info.get("CLINVAR_SIG", "")
            
            # Map abbreviated clinical significance to full terms expected by frontend
            clinvar_sig_mapped = {
                "PATH": "Pathogenic",
                "LP": "Likely Pathogenic",
                "VUS": "VUS",
                "LB": "Likely Benign",
                "B": "Benign"
            }.get(clinvar_sig, clinvar_sig)  # Default to original if not found
            
            zygosity_str = info.get("ZYGOSITY", "")
            literature_counts_str = info.get("INFO_LITERATURE_COUNTS", "")
            linked_variants_str = info.get("LINKED_VARIANT", "")

            # Parse zygosity (can be multiple values)
            zygosities = zygosity_str.split(",") if zygosity_str else []

            # Calculate nucleotidePosition (1-based position in RNA sequence)
            # Convert genomic position to nucleotide position (reverse strand)
            nucleotide_pos = (
                gene_end - position + 1 if gene_start <= position <= gene_end else None
            )

            # Create variant ID if not provided
            if not var_id or var_id == ".":
                var_id = f"{chrom}-{position}-{ref}-{alt}"

            # Create variant dictionary
            variant_dict = {
                "id": var_id,
                "geneId": gene_id,
                "position": position,
                "nucleotidePosition": nucleotide_pos,
                "ref": ref,
                "alt": alt,
                "hgvs": hgvs,
                "consequence": None,
                "clinvar_significance": None,
                "clinical_significance": clinvar_sig_mapped,
                "pmid": None,
                "function_score": None,
                "pvalues": None,
                "qvalues": None,
                "depletion_group": None,
                "gnomad_ac": None,
                "gnomad_hom": None,
                "aou_ac": None,
                "aou_hom": None,
                "ukbb_ac": None,
                "ukbb_hom": None,
                "cadd_score": None,
                "zygosity": zygosities[0]
                if zygosities
                else None,  # Take first zygosity
                "cohort": "clinical",  # All variants from this VCF are clinical
            }

            # Store variant
            all_variants[var_id] = variant_dict

            # Parse literature counts
            if literature_counts_str:
                for count_item in literature_counts_str.split(","):
                    if ":" in count_item:
                        lit_id, count = count_item.split(":", 1)
                        literature_counts_data.append(
                            {
                                "variant_id": var_id,
                                "literature_id": lit_id.strip(),
                                "counts": int(count.strip()),
                            }
                        )

            # Parse linked variants for compound heterozygous
            if linked_variants_str:
                linked_ids = [vid.strip() for vid in linked_variants_str.split(",")]
                # We'll handle links after all variants are processed

    # Insert all unique variants
    print(f"Inserting {len(all_variants)} unique variants...")
    variants_list = list(all_variants.values())
    insert_variants(variants_list)
    print("Variants inserted successfully")

    # Insert literature counts
    if literature_counts_data:
        print(f"Inserting {len(literature_counts_data)} literature counts...")
        insert_literature_counts(literature_counts_data)
        print("Literature counts inserted successfully")

    # Create links for compound heterozygous variants
    links = []
    for variant_id, variant in all_variants.items():
        # Check if this variant has linked variants in the VCF
        vcf_path_again = (
            Path(__file__).parent.parent / "data" / "rnu4-2" / "variants.vcf"
        )
        with open(vcf_path_again, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#"):
                    continue
                fields = line.split("\t")
                if len(fields) >= 8 and fields[2] == variant_id:
                    info = parse_vcf_info(fields[7])
                    linked_variants_str = info.get("LINKED_VARIANT", "")
                    if linked_variants_str:
                        linked_ids = [
                            vid.strip() for vid in linked_variants_str.split(",")
                        ]
                        for linked_id in linked_ids:
                            if linked_id in all_variants:
                                # Ensure ordering for CHECK constraint
                                vid1, vid2 = sorted([variant_id, linked_id])
                                links.append(
                                    {"variant_id_1": vid1, "variant_id_2": vid2}
                                )
                    break

    # Remove duplicates
    unique_links = []
    seen = set()
    for link in links:
        key = (link["variant_id_1"], link["variant_id_2"])
        if key not in seen:
            unique_links.append(link)
            seen.add(key)

    # Insert variant links
    if unique_links:
        print(f"\nInserting {len(unique_links)} variant links...")
        insert_variant_links(unique_links)
        print("Variant links inserted successfully")
    else:
        print("\nNo compound heterozygous variants found")

    # Summary
    print("\n=== Summary ===")
    print(f"Total unique variants: {len(all_variants)}")
    print(f"Variant links: {len(unique_links)}")
    print(f"Literature counts: {len(literature_counts_data)}")

    # Show some statistics
    hom_count = sum(1 for v in all_variants.values() if v["zygosity"] == "hom")
    het_count = sum(1 for v in all_variants.values() if v["zygosity"] == "het")
    print(f"Homozygous variants: {hom_count}")
    print(f"Heterozygous variants: {het_count}")

    # Show ACMG classification distribution
    acmg_counts = defaultdict(int)
    for v in all_variants.values():
        acmg_counts[v["clinical_significance"]] += 1
    print("\nACMG classifications:")
    for acmg, count in sorted(acmg_counts.items()):
        print(f"  {acmg}: {count}")


def insert_clinical_literature():
    """Insert literature references for clinical variants"""
    import json

    # Load literature data from JSON file
    literature_file_path = (
        Path(__file__).parent.parent / "data" / "rnu4-2" / "literature.json"
    )

    with open(literature_file_path, "r") as f:
        literature_data = json.load(f)

    print(f"Inserting {len(literature_data)} literature entries...")
    insert_literature(literature_data)
    print("Literature inserted successfully!")


if __name__ == "__main__":
    print("Loading clinical literature...")
    insert_clinical_literature()
    print("\nLoading curated clinical variants...")
    load_clinical_variants()
    print("\nDone!")
