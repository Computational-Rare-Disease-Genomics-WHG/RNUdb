"""Simple VCF parser for RNUdb - extracts only needed INFO fields."""

from typing import Any


def parse_vcf(
    content: str, field_mappings: list[dict] | None = None
) -> list[dict[str, Any]]:
    """
    Parse VCF content and extract variant data.

    Args:
        content: VCF file content
        field_mappings: Optional list of {vcfField, targetColumn} mappings

    Expected INFO fields (when no mapping provided):
    - HGVS
    - FUNCTION_SCORE
    - PVALUES
    - QVALUES
    - DEPLETION_GROUP
    - CADD_SCORE
    - GNOMAD_AC
    - GNOMAD_HOM
    - AOU_AC
    - AOU_HOM

    Returns list of variant dicts with:
    - id: CHROM-POS-REF-ALT
    - chrom
    - pos
    - ref
    - alt
    - info fields
    """
    mapping_dict: dict[str, str] = {}
    if field_mappings:
        for m in field_mappings:
            if m.get("vcfField") and m.get("targetColumn"):
                mapping_dict[m["vcfField"].upper()] = m["targetColumn"]

    lines = content.strip().split("\n")
    variants = []

    info_field_indices = {}

    for line in lines:
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        if line.startswith("##"):
            continue

        if line.startswith("#CHROM"):
            headers = line.split("\t")
            for i, h in enumerate(headers):
                info_field_indices[h.lower()] = i
            continue

        parts = line.split("\t")
        if len(parts) < 8:
            continue

        chrom = parts[0]
        pos = int(parts[1])
        variant_id = (
            parts[2] if parts[2] != "." else f"{chrom}-{pos}-{parts[3]}-{parts[4]}"
        )
        ref = parts[3]
        alt = parts[4]
        info_str = parts[7]

        info_fields = parse_info_field(info_str, mapping_dict)

        variant = {
            "id": variant_id,
            "chrom": chrom,
            "pos": pos,
            "ref": ref,
            "alt": alt,
            **info_fields,
        }
        variants.append(variant)

    return variants


def parse_info_field(
    info_str: str, mapping: dict[str, str] | None = None
) -> dict[str, Any]:
    """Parse INFO field string into dict with optional field mapping."""
    result = {}

    if not info_str:
        return result

    for pair in info_str.split(";"):
        if "=" in pair:
            key, value = pair.split("=", 1)
            key = key.strip().upper()
            value = value.strip()

            mapped_key = mapping.get(key) if mapping else None
            target_key = mapped_key if mapped_key else key.lower()

            if target_key == "function_score":
                result["function_score"] = (
                    float(value) if value and value != "." else None
                )
            elif target_key == "pvalues":
                result["pvalues"] = float(value) if value and value != "." else None
            elif target_key == "qvalues":
                result["qvalues"] = float(value) if value and value != "." else None
            elif target_key == "cadd_score":
                result["cadd_score"] = float(value) if value and value != "." else None
            elif target_key == "gnomad_ac":
                result["gnomad_ac"] = int(value) if value and value != "." else None
            elif target_key == "gnomad_hom":
                result["gnomad_hom"] = int(value) if value and value != "." else None
            elif target_key == "aou_ac":
                result["aou_ac"] = int(value) if value and value != "." else None
            elif target_key == "aou_hom":
                result["aou_hom"] = int(value) if value and value != "." else None
            elif target_key == "hgvs":
                result["hgvs"] = value if value and value != "." else None
            elif target_key == "depletion_group":
                result["depletion_group"] = value if value and value != "." else None
            elif target_key == "nucleotideposition":
                result["nucleotidePosition"] = (
                    int(value) if value and value != "." else None
                )
            elif target_key == "consequence":
                result["consequence"] = value if value and value != "." else None
            else:
                result[target_key] = value

    return result


def validate_vcf_content(content: str) -> tuple[bool, list[str]]:
    """
    Validate VCF content format.

    Returns (is_valid, error_messages)
    """
    errors = []
    lines = content.strip().split("\n")

    if not lines:
        errors.append("Empty VCF content")
        return False, errors

    has_header = False
    has_data = False

    for i, line in enumerate(lines):
        line = line.strip()

        if not line:
            continue

        if line.startswith("##fileformat"):
            has_header = True
            continue

        if line.startswith("#CHROM"):
            has_header = True
            continue

        if line.startswith("#"):
            continue

        parts = line.split("\t")
        if len(parts) < 8:
            errors.append(
                f"Line {i + 1}: Expected at least 8 columns, got {len(parts)}"
            )
            continue

        try:
            pos = int(parts[1])
        except ValueError:
            errors.append(f"Line {i + 1}: Invalid position '{parts[1]}'")

        has_data = True

    if not has_header:
        errors.append("Missing VCF header")

    if not has_data:
        errors.append("No data rows found")

    return len(errors) == 0, errors
