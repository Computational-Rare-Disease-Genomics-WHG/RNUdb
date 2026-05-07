#!/usr/bin/env python3
"""Convert SGE variants to clinical_variants.vcf format.

This script takes the existing sge_variants.vcf and outputs a clinical_variants.vcf
with only the genomic data (no CLINVAR_SIG, no population data).
"""

import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "rnu4-2"
SGE_VCF = DATA_DIR / "sge_variants.vcf"
OUTPUT_VCF = DATA_DIR / "clinical_variants.vcf"


def convert_sge_to_clinical_vcf():
    """Convert SGE VCF to clinical variants VCF."""
    if not SGE_VCF.exists():
        print(f"Error: {SGE_VCF} not found")
        sys.exit(1)
    
    lines = SGE_VCF.read_text().strip().split("\n")
    
    output_lines = []
    
    for line in lines:
        if line.startswith("##"):
            if "source" in line.lower():
                line = line.replace("RNUdb_SGE", "RNUdb_Clinical")
            output_lines.append(line)
            continue
            
        if line.startswith("#CHROM"):
            output_lines.append(line)
            continue
            
        if not line.strip():
            continue
            
        parts = line.split("\t")
        if len(parts) < 8:
            continue
            
        chrom = parts[0]
        pos = parts[1]
        variant_id = parts[2] if parts[2] != "." else f"{chrom}-{pos}-{parts[3]}-{parts[4]}"
        ref = parts[3]
        alt = parts[4]
        qual = parts[5]
        filter_field = parts[6]
        info = parts[7]
        
        new_info_parts = []
        for pair in info.split(";"):
            if "=" in pair:
                key = pair.split("=")[0].upper()
                if key in ["HGVS", "FUNCTION_SCORE", "PVALUES", "QVALUES", "DEPLETION_GROUP", "CADD_SCORE"]:
                    new_info_parts.append(pair)
        
        new_info = ";".join(new_info_parts) if new_info_parts else "."
        
        new_line = f"{chrom}\t{pos}\t{variant_id}\t{ref}\t{alt}\t{qual}\t{filter_field}\t{new_info}"
        output_lines.append(new_line)
    
    OUTPUT_VCF.write_text("\n".join(output_lines))
    print(f"Created {OUTPUT_VCF}")
    
    variant_count = sum(1 for line in output_lines if not line.startswith("#"))
    print(f"Converted {variant_count} variants")


if __name__ == "__main__":
    convert_sge_to_clinical_vcf()