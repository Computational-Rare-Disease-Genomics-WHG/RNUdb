#!/usr/bin/env python3
"""Convert RNUdb data to new import format - minimal VCF files."""

import json
import csv
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "rnu4-2"


def parse_vcf_info(info_str: str) -> dict:
    """Parse VCF INFO field into a dictionary."""
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


def load_sge_data() -> dict:
    """Load SGE data from text file."""
    sge_file = DATA_DIR / "rnu4-2_sge.txt"
    sge_data = {}
    with open(sge_file) as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            variant_id = row["ID"]
            sge_data[variant_id] = {
                "nucleotide": row.get("nucleotide"),
                "hgvs": row.get("HGVS"),
                "function_score": row.get("function_score"),
                "pvalues": row.get("pvalues"),
                "qvalues": row.get("qvalues"),
                "depletion_group": row.get("depletion_group"),
                "cadd_score": row.get("CADD_score"),
                "aou_ac": row.get("AoU_AC"),
                "aou_hom": row.get("AoU_hom"),
                "gnomad_ac": row.get("UKBiobank_AC"),
                "gnomad_hom": row.get("UKBiobank_hom"),
            }
    return sge_data


def load_variants() -> list:
    """Load variants from VCF."""
    variants = []
    with open(DATA_DIR / "variants.vcf") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#"):
                continue
            fields = line.split("\t")
            if len(fields) < 8:
                continue
            chrom, pos, var_id, ref, alt, qual, filter_field, info_str = fields[:8]
            variants.append({
                "chrom": chrom,
                "pos": int(pos),
                "id": var_id,
                "ref": ref,
                "alt": alt,
                "filter": filter_field,
                "info": parse_vcf_info(info_str),
            })
    return variants


def main():
    """Convert data to new format."""
    print("Loading data...")
    sge_data = load_sge_data()
    variants = load_variants()
    variant_ids_in_clinical = {v["id"] for v in variants}

    print(f"Loaded: {len(sge_data)} SGE records, {len(variants)} clinical variants")

    print("\n=== Creating clinical_variants.vcf (minimal - HGVS only) ===")

    # Minimal VCF - only position/ref/alt and HGVS (clinical variants only)
    vcf_lines = [
        '##fileformat=VCFv4.2',
        '##fileDate=20251125',
        '##source=RNUdb',
        '##reference=GRCh38',
        '##INFO=<ID=HGVS,Number=1,Type=String,Description="HGVS nomenclature for the variant">',
        '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO',
    ]

    for v in variants:
        info_parts = []
        if v["info"].get("HGVS"):
            info_parts.append(f"HGVS={v['info']['HGVS']}")

        info_str = ";".join(info_parts) if info_parts else "."

        vcf_lines.append(
            f"{v['chrom']}\t{v['pos']}\t{v['id']}\t{v['ref']}\t{v['alt']}\t.\tPASS\t{info_str}"
        )

    vcf_output = DATA_DIR / "clinical_variants.vcf"
    with open(vcf_output, "w") as f:
        f.write("\n".join(vcf_lines))

    print(f"Written: {vcf_output}")
    print(f"Clinical variants: {len(vcf_lines) - 6}")

    print("\n=== Creating sge_variants.vcf (ALL SGE variants in gene region) ===")

    # SGE VCF - ALL variants with SGE data (not just clinical ones)
    sge_vcf_lines = [
        '##fileformat=VCFv4.2',
        '##fileDate=20251125',
        '##source=RNUdb_SGE',
        '##reference=GRCh38',
        '##INFO=<ID=HGVS,Number=1,Type=String,Description="HGVS nomenclature">',
        '##INFO=<ID=NUCLEOTIDE_POSITION,Number=1,Type=Integer,Description="Position in RNA sequence">',
        '##INFO=<ID=FUNCTION_SCORE,Number=1,Type=Float,Description="Functional impact score">',
        '##INFO=<ID=PVALUES,Number=1,Type=Float,Description="Statistical p-value">',
        '##INFO=<ID=QVALUES,Number=1,Type=Float,Description="Adjusted q-value">',
        '##INFO=<ID=DEPLETION_GROUP,Number=1,Type=String,Description="Depletion category">',
        '##INFO=<ID=CADD_SCORE,Number=1,Type=Float,Description="CADD pathogenicity score">',
        '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO',
    ]

    # Process ALL SGE data records - not just those in clinical VCF
    for sge_id, sge in sge_data.items():
        # Parse variant ID to get chrom, pos, ref, alt
        # Format: chr12-120291903-T-G or chr12-120291842-A- (deletion)
        try:
            parts = sge_id.replace("chr", "").split("-")
            chrom = parts[0]
            pos = int(parts[1])
            ref = parts[2]
            alt = parts[3] if len(parts) > 3 else ""

            # Skip variants with empty alt (deletions can't be represented in standard VCF)
            if not alt:
                continue
            # Skip variants with malformed alt (like just "-")
            if alt == "-":
                continue
        except:
            continue

        # Get HGVS from SGE data directly (or from clinical VCF if not in txt)
        hgvs = sge.get("hgvs") or ""
        if not hgvs:
            for v in variants:
                if v["id"] == sge_id:
                    hgvs = v["info"].get("HGVS", "")
                    break

        info_parts = []
        if hgvs and hgvs != "NA":
            info_parts.append(f"HGVS={hgvs}")

        if sge.get("nucleotide") and sge["nucleotide"] != "NA":
            info_parts.append(f"NUCLEOTIDE_POSITION={sge['nucleotide']}")

        if sge.get("function_score") and sge["function_score"] != "NA":
            info_parts.append(f"FUNCTION_SCORE={sge['function_score']}")
        if sge.get("pvalues") and sge["pvalues"] != "NA":
            info_parts.append(f"PVALUES={sge['pvalues']}")
        if sge.get("qvalues") and sge["qvalues"] != "NA":
            info_parts.append(f"QVALUES={sge['qvalues']}")
        if sge.get("depletion_group"):
            info_parts.append(f"DEPLETION_GROUP={sge['depletion_group']}")
        if sge.get("cadd_score") and sge["cadd_score"] != "NA":
            info_parts.append(f"CADD_SCORE={sge['cadd_score']}")

        info_str = ";".join(info_parts) if info_parts else "."

        sge_vcf_lines.append(
            f"chr{chrom}\t{pos}\t{sge_id}\t{ref}\t{alt}\t.\tPASS\t{info_str}"
        )

    sge_vcf_output = DATA_DIR / "sge_variants.vcf"
    with open(sge_vcf_output, "w") as f:
        f.write("\n".join(sge_vcf_lines))

    print(f"Written: {sge_vcf_output}")
    print(f"SGE variants: {len(sge_vcf_lines) - 12}")

    print("\n=== Creating variant_classifications.csv (clinical from papers) ===")

    # Load literature for DOI mapping
    with open(DATA_DIR / "literature.json") as f:
        literature = json.load(f)

    paper_id_to_doi = {lit["id"]: lit.get("doi", "") for lit in literature}

    classifications = []

    for v in variants:
        variant_id = v["id"]

        # Parse INFO_LITERATURE_COUNTS: "chen_et_al_2024:5,nava_et_al_2025:1"
        lit_counts_str = v["info"].get("INFO_LITERATURE_COUNTS", "")
        if not lit_counts_str:
            continue

        for pair in lit_counts_str.split(","):
            if ":" not in pair:
                continue
            old_paper_id, count = pair.split(":", 1)
            count = int(count.strip())

            doi = paper_id_to_doi.get(old_paper_id.strip(), "")
            if not doi:
                continue

            # Get zygosity from VCF
            zygosity = v["info"].get("ZYGOSITY", "")

            # Get clinical significance
            clin_sig = v["info"].get("CLINVAR_SIG", "")
            clin_sig_map = {
                "PATH": "Pathogenic",
                "LP": "Likely Pathogenic",
                "VUS": "VUS",
                "LB": "Likely Benign",
                "B": "Benign",
            }
            clinical_significance = clin_sig_map.get(clin_sig, clin_sig)

            # Get linked variants
            linked = v["info"].get("LINKED_VARIANT", "")

            classifications.append({
                "variant_id": variant_id,
                "paper_id": doi,
                "clinical_significance": clinical_significance,
                "zygosity": zygosity.split(",")[0] if zygosity else "",
                "disease": "",
                "counts": count,
                "linked_variant_ids": linked,
            })

    classifications_output = DATA_DIR / "variant_classifications.csv"
    fieldnames = ["variant_id", "paper_id", "clinical_significance", "zygosity", "disease", "counts", "linked_variant_ids"]

    with open(classifications_output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(classifications)

    print(f"Written: {classifications_output}")
    print(f"Classifications: {len(classifications)}")

    print("\n=== Summary ===")
    print(f"clinical_variants.vcf: {len(vcf_lines) - 6} variants")
    print(f"sge_variants.vcf: {len(sge_vcf_lines) - 12} variants")
    print(f"variant_classifications.csv: {len(classifications)} records")


if __name__ == "__main__":
    main()
