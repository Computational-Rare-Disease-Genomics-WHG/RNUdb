#!/usr/bin/env python3
"""Convert existing clinical variants to new import format.

This script reads the existing variants.vcf and outputs:
1. clinical_variants.vcf - genomic data only
2. variant_classifications.csv - clinical classifications linked to literature

The original variants.vcf contains:
- HGVS, CLINVAR_SIG, ZYGOSITY, INFO_LITERATURE_COUNTS, LINKED_VARIANT
"""

import csv
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "rnu4-2"
VARIANTS_VCF = DATA_DIR / "variants.vcf"
OUTPUT_VCF = DATA_DIR / "clinical_variants.vcf"
OUTPUT_CSV = DATA_DIR / "variant_classifications.csv"


def parse_info_field(info_str: str) -> dict:
    """Parse INFO field into dict."""
    result = {}
    for pair in info_str.split(";"):
        if "=" in pair:
            key, value = pair.split("=", 1)
            result[key] = value
    return result


def convert_clinical_variants():
    """Convert clinical variants to new format."""
    if not VARIANTS_VCF.exists():
        print(f"Error: {VARIANTS_VCF} not found")
        sys.exit(1)
    
    lines = VARIANTS_VCF.read_text().strip().split("\n")
    
    vcf_lines = []
    csv_rows = []
    
    CLINVAR_MAP = {
        "PATH": "Pathogenic",
        "LP": "Likely Pathogenic",
        "VUS": "VUS",
        "LB": "Likely Benign",
        "B": "Benign",
    }
    
    for line in lines:
        if line.startswith("##"):
            if "source" in line.lower():
                line = line.replace("ReNU_Syndrome_Variants_Database", "RNUdb_Clinical")
            vcf_lines.append(line)
            continue
            
        if line.startswith("#CHROM"):
            vcf_lines.append(line)
            continue
            
        if not line.strip():
            continue
            
        parts = line.split("\t")
        if len(parts) < 8:
            continue
            
        chrom = parts[0]
        pos = parts[1]
        variant_id = parts[2]
        ref = parts[3]
        alt = parts[4]
        qual = parts[5]
        filter_field = parts[6]
        info = parts[7]
        
        info_dict = parse_info_field(info)
        
        hgvs = info_dict.get("HGVS", "")
        clinvar_sig = info_dict.get("CLINVAR_SIG", "")
        zygosity = info_dict.get("ZYGOSITY", "")
        literature_counts = info_dict.get("INFO_LITERATURE_COUNTS", "")
        linked_variants = info_dict.get("LINKED_VARIANT", "")
        
        clinical_sig = CLINVAR_MAP.get(clinvar_sig, clinvar_sig)
        
        new_info_parts = []
        if hgvs:
            new_info_parts.append(f"HGVS={hgvs}")
        
        new_info = ";".join(new_info_parts) if new_info_parts else "."
        
        new_line = f"{chrom}\t{pos}\t{variant_id}\t{ref}\t{alt}\t{qual}\t{filter_field}\t{new_info}"
        vcf_lines.append(new_line)
        
        if literature_counts:
            for lc in literature_counts.split(";"):
                if ":" in lc:
                    paper_id, count = lc.split(":", 1)
                    csv_rows.append({
                        "variant_id": variant_id,
                        "paper_id": paper_id,
                        "clinical_significance": clinical_sig,
                        "zygosity": zygosity.split(",")[0] if zygosity else "",
                        "disease": "neurodevelopmental",
                        "counts": count,
                        "linked_variant_ids": linked_variants.replace(",", ";") if linked_variants else "",
                        "clinvar_significance": clinvar_sig,
                    })
        else:
            csv_rows.append({
                "variant_id": variant_id,
                "paper_id": "",
                "clinical_significance": clinical_sig,
                "zygosity": zygosity.split(",")[0] if zygosity else "",
                "disease": "neurodevelopmental",
                "counts": "",
                "linked_variant_ids": linked_variants.replace(",", ";") if linked_variants else "",
                "clinvar_significance": clinvar_sig,
            })
    
    OUTPUT_VCF.write_text("\n".join(vcf_lines))
    print(f"Created {OUTPUT_VCF}")
    
    variant_count = sum(1 for line in vcf_lines if not line.startswith("#"))
    print(f"Converted {variant_count} variants to VCF")
    
    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "variant_id", "paper_id", "clinical_significance", "zygosity",
            "disease", "counts", "linked_variant_ids", "clinvar_significance"
        ])
        writer.writeheader()
        for row in csv_rows:
            writer.writerow(row)
    
    print(f"Created {OUTPUT_CSV}")
    print(f"Wrote {len(csv_rows)} classification rows")


if __name__ == "__main__":
    convert_clinical_variants()