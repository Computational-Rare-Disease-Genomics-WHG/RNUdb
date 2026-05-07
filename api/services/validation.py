"""Validation services for batch imports and data integrity."""

import re
from dataclasses import dataclass
from typing import Any


@dataclass
class ValidationError:
    row: int
    field: str
    message: str
    value: Any = None


@dataclass
class ValidationReport:
    valid: bool
    errors: list[ValidationError]
    warnings: list[ValidationError]
    valid_rows: list[dict[str, Any]]
    total_rows: int


# Valid IUPAC nucleotides
VALID_NUCLEOTIDES = set("ACGTUacgtuNnrRYYKkMmSsWwBbDdHhVv")

# Valid clinical significance values
VALID_CLINICAL_SIG = {
    "Pathogenic",
    "Likely Pathogenic",
    "VUS",
    "Likely Benign",
    "Benign",
    "LP",
    "LB",
    "P",
    "B",
}

# Clinical significance mapping
CLINICAL_SIG_MAP = {
    "LP": "Likely Pathogenic",
    "P": "Pathogenic",
    "LB": "Likely Benign",
    "B": "Benign",
    "PATH": "Pathogenic",
    "VUS": "VUS",
}


def validate_variant_batch(
    rows: list[dict[str, Any]],
    gene: dict[str, Any],
    existing_variants: set[str] | None = None,
) -> ValidationReport:
    """Validate a batch of variant rows for import.

    Args:
        rows: List of variant dictionaries with keys like position, ref, alt, etc.
        gene: Gene dictionary with chromosome, start, end keys
        existing_variants: Optional set of existing variant IDs to check for duplicates

    Returns:
        ValidationReport with errors, warnings, and valid rows
    """
    errors = []
    warnings = []
    valid_rows = []

    if existing_variants is None:
        existing_variants = set()

    gene_start = gene.get("start", 0)
    gene_end = gene.get("end", 0)
    gene_id = gene.get("id", "")

    # Track duplicates within the batch
    batch_keys = set()

    for i, row in enumerate(rows, start=1):
        row_errors = []
        row_warnings = []

        # Required fields
        position = row.get("position")
        ref = row.get("ref")
        alt = row.get("alt")

        if position is None:
            row_errors.append(
                ValidationError(i, "position", "Position is required", None)
            )
        if not ref:
            row_errors.append(
                ValidationError(i, "ref", "Reference allele is required", ref)
            )
        if not alt:
            row_errors.append(
                ValidationError(i, "alt", "Alternate allele is required", alt)
            )

        # Skip further validation if required fields missing
        if row_errors:
            errors.extend(row_errors)
            continue

        # Validate position is numeric
        try:
            pos = int(position)
        except (ValueError, TypeError):
            row_errors.append(
                ValidationError(i, "position", "Position must be a number", position)
            )
            errors.extend(row_errors)
            continue

        # Validate coordinates within gene bounds
        if pos < gene_start or pos > gene_end:
            row_errors.append(
                ValidationError(
                    i,
                    "position",
                    f"Position {pos} is outside gene bounds ({gene_start}-{gene_end})",
                    pos,
                )
            )

        # Validate nucleotides
        if ref and not all(c in VALID_NUCLEOTIDES for c in str(ref)):
            row_errors.append(
                ValidationError(
                    i,
                    "ref",
                    (
                        f"Invalid reference allele '{ref}'. "
                        "Must be valid IUPAC nucleotides"
                    ),
                    ref,
                )
            )

        if alt and not all(c in VALID_NUCLEOTIDES for c in str(alt)):
            row_errors.append(
                ValidationError(
                    i,
                    "alt",
                    (
                        f"Invalid alternate allele '{alt}'. "
                        "Must be valid IUPAC nucleotides"
                    ),
                    alt,
                )
            )

        # Validate variant ID format (chrCHR-POS-REF-ALT)
        variant_id = row.get("id")
        if variant_id:
            id_pattern = re.compile(r"^chr\d+-\d+-[ATCGatcg]+-[ATCGatcg]+$")
            if not id_pattern.match(variant_id):
                row_errors.append(
                    ValidationError(
                        i,
                        "id",
                        f"Invalid variant ID '{variant_id}'. Must match format chrCHR-POS-REF-ALT (e.g., chr12-120291764-C-T)",
                        variant_id,
                    )
                )

        # Validate clinical significance
        clinical_sig = row.get("clinical_significance")
        if clinical_sig and clinical_sig not in VALID_CLINICAL_SIG:
            row_errors.append(
                ValidationError(
                    i,
                    "clinical_significance",
                    f"Invalid clinical significance '{clinical_sig}'. "
                    f"Must be one of: {', '.join(sorted(VALID_CLINICAL_SIG))}",
                    clinical_sig,
                )
            )

        # Validate zygosity
        zygosity = row.get("zygosity")
        if zygosity and zygosity.lower() not in {
            "het",
            "hom",
            "heterozygous",
            "homozygous",
        }:
            row_warnings.append(
                ValidationError(
                    i,
                    "zygosity",
                    f"Unexpected zygosity value '{zygosity}'. Expected: het, hom",
                    zygosity,
                )
            )

        # Validate numeric fields
        numeric_fields = [
            "function_score",
            "cadd_score",
            "gnomad_ac",
            "gnomad_hom",
            "aou_ac",
            "aou_hom",
            "ukbb_ac",
            "ukbb_hom",
        ]
        for field in numeric_fields:
            value = row.get(field)
            if value is not None and value != "":
                try:
                    float(value)
                except (ValueError, TypeError):
                    row_errors.append(
                        ValidationError(
                            i, field, f"{field} must be numeric, got '{value}'", value
                        )
                    )

        # Validate HGVS basic syntax
        hgvs = row.get("hgvs")
        if hgvs and not re.match(
            r"^(c\.|n\.|g\.|m\.|r\.)[\.\d\w>\-_\*\(\)\+\?]+$", str(hgvs)
        ):
            row_warnings.append(
                ValidationError(
                    i,
                    "hgvs",
                    (
                        f"HGVS notation '{hgvs}' may be malformed. "
                        "Expected format: c.123A>G or n.140G>A"
                    ),
                    hgvs,
                )
            )

        # Check for duplicates within batch
        variant_key = f"{pos}_{ref}_{alt}"
        if variant_key in batch_keys:
            row_errors.append(
                ValidationError(
                    i,
                    "duplicate",
                    f"Duplicate variant at position {pos} with ref={ref}, alt={alt}",
                    variant_key,
                )
            )
        else:
            batch_keys.add(variant_key)

        # Check for duplicates in existing database
        if variant_key in existing_variants:
            row_warnings.append(
                ValidationError(
                    i,
                    "duplicate",
                    (
                        f"Variant at position {pos} with ref={ref}, alt={alt} "
                        "already exists in database"
                    ),
                    variant_key,
                )
            )

        if row_errors:
            errors.extend(row_errors)
        else:
            # Normalize the row
            normalized_row = dict(row)
            normalized_row["position"] = pos
            normalized_row["geneId"] = gene_id

            # Normalize clinical significance
            if clinical_sig:
                normalized_row["clinical_significance"] = CLINICAL_SIG_MAP.get(
                    clinical_sig, clinical_sig
                )

            valid_rows.append(normalized_row)
            warnings.extend(row_warnings)

    return ValidationReport(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        valid_rows=valid_rows,
        total_rows=len(rows),
    )


def validate_structure(data: dict[str, Any], gene: dict[str, Any]) -> ValidationReport:
    """Validate RNA structure data for import.

    Args:
        data: Structure dictionary with nucleotides, basePairs, etc.
        gene: Gene dictionary for validation context

    Returns:
        ValidationReport
    """
    errors = []
    warnings = []

    # Required top-level fields
    if not data.get("id"):
        errors.append(ValidationError(0, "id", "Structure ID is required"))
    if not data.get("name"):
        errors.append(ValidationError(0, "name", "Structure name is required"))

    nucleotides = data.get("nucleotides")
    if not isinstance(nucleotides, list):
        errors.append(ValidationError(0, "nucleotides", "nucleotides must be an array"))
    elif len(nucleotides) == 0:
        errors.append(
            ValidationError(0, "nucleotides", "At least one nucleotide is required")
        )

    base_pairs = data.get("base_pairs")
    if not isinstance(base_pairs, list):
        errors.append(ValidationError(0, "base_pairs", "base_pairs must be an array"))

    if errors:
        return ValidationReport(
            valid=False, errors=errors, warnings=warnings, valid_rows=[], total_rows=1
        )

    # Validate nucleotides
    valid_nucleotide_ids = set()
    for i, nt in enumerate(nucleotides, start=1):
        if not isinstance(nt, dict):
            errors.append(
                ValidationError(
                    i, "nucleotide", "Each nucleotide must be an object", nt
                )
            )
            continue

        nt_id = nt.get("id")
        if not isinstance(nt_id, int):
            errors.append(
                ValidationError(
                    i, "nucleotide.id", "Nucleotide ID must be an integer", nt_id
                )
            )
        else:
            valid_nucleotide_ids.add(nt_id)

        base = nt.get("base")
        if not base or str(base).upper() not in {"A", "C", "G", "U"}:
            errors.append(
                ValidationError(
                    i,
                    "nucleotide.base",
                    f"Invalid base '{base}'. Must be A, C, G, or U",
                    base,
                )
            )

        for coord in ["x", "y"]:
            val = nt.get(coord)
            if not isinstance(val, int | float):
                errors.append(
                    ValidationError(
                        i,
                        f"nucleotide.{coord}",
                        f"Coordinate {coord} must be numeric, got {type(val).__name__}",
                        val,
                    )
                )

    # Validate base pairs
    for i, bp in enumerate(base_pairs, start=1):
        if not isinstance(bp, dict):
            errors.append(
                ValidationError(i, "basePair", "Each base pair must be an object", bp)
            )
            continue

        from_pos = bp.get("from_pos", bp.get("from"))
        to_pos = bp.get("to_pos", bp.get("to"))

        if not isinstance(from_pos, int):
            errors.append(
                ValidationError(i, "basePair.from", "from must be an integer", from_pos)
            )
        elif from_pos not in valid_nucleotide_ids:
            errors.append(
                ValidationError(
                    i,
                    "basePair.from",
                    f"from position {from_pos} does not match any nucleotide ID",
                    from_pos,
                )
            )

        if not isinstance(to_pos, int):
            errors.append(
                ValidationError(i, "basePair.to", "to must be an integer", to_pos)
            )
        elif to_pos not in valid_nucleotide_ids:
            errors.append(
                ValidationError(
                    i,
                    "basePair.to",
                    f"to position {to_pos} does not match any nucleotide ID",
                    to_pos,
                )
            )

    # Validate structural features if present
    features = data.get("structural_features", [])
    if isinstance(features, list):
        for i, feature in enumerate(features, start=1):
            if not isinstance(feature, dict):
                errors.append(
                    ValidationError(
                        i, "structuralFeature", "Each feature must be an object"
                    )
                )
                continue

            if not feature.get("id"):
                errors.append(
                    ValidationError(i, "structuralFeature.id", "Feature ID is required")
                )
            if not feature.get("feature_type"):
                errors.append(
                    ValidationError(
                        i, "structuralFeature.feature_type", "Feature type is required"
                    )
                )

            nt_ids = feature.get("nucleotide_ids", [])
            if not isinstance(nt_ids, list):
                errors.append(
                    ValidationError(
                        i,
                        "structuralFeature.nucleotide_ids",
                        "nucleotide_ids must be an array",
                    )
                )
            else:
                for nt_id in nt_ids:
                    if nt_id not in valid_nucleotide_ids:
                        errors.append(
                            ValidationError(
                                i,
                                "structuralFeature.nucleotide_ids",
                                f"Nucleotide ID {nt_id} in feature does not exist",
                                nt_id,
                            )
                        )

            if not feature.get("label_text"):
                errors.append(
                    ValidationError(
                        i,
                        "structuralFeature.label_text",
                        "Feature label_text is required",
                    )
                )

    # Check nucleotide count vs gene sequence length
    gene_seq = gene.get("sequence", "")
    if gene_seq and len(nucleotides) != len(gene_seq):
        warnings.append(
            ValidationError(
                0,
                "nucleotide_count",
                (
                    f"Nucleotide count ({len(nucleotides)}) does not match "
                    f"gene sequence length ({len(gene_seq)})"
                ),
                {"nucleotides": len(nucleotides), "sequence": len(gene_seq)},
            )
        )

    return ValidationReport(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        valid_rows=[data] if len(errors) == 0 else [],
        total_rows=1,
    )


def validate_bed_intervals(
    intervals: list[dict[str, Any]], gene: dict[str, Any]
) -> ValidationReport:
    """Validate BED track intervals for import.

    Args:
        intervals: List of interval dictionaries with chrom, chromStart, chromEnd, etc.
        gene: Gene dictionary for coordinate validation

    Returns:
        ValidationReport
    """
    errors = []
    warnings = []
    valid_rows = []

    gene_chr = gene.get("chromosome", "").replace("chr", "").replace("Chr", "")
    gene_start = gene.get("start", 0)
    gene_end = gene.get("end", 0)

    for i, interval in enumerate(intervals, start=1):
        row_errors = []
        row_warnings = []

        chrom = interval.get("chrom", "")
        chrom_start = interval.get("chromStart")
        chrom_end = interval.get("chromEnd")

        # Required fields
        if not chrom:
            row_errors.append(ValidationError(i, "chrom", "Chromosome is required"))

        if chrom_start is None:
            row_errors.append(
                ValidationError(i, "chromStart", "Start coordinate is required")
            )
        if chrom_end is None:
            row_errors.append(
                ValidationError(i, "chromEnd", "End coordinate is required")
            )

        if row_errors:
            errors.extend(row_errors)
            continue

        # Validate coordinates are numeric
        try:
            start = int(chrom_start)
        except (ValueError, TypeError):
            row_errors.append(
                ValidationError(
                    i, "chromStart", "Start must be an integer", chrom_start
                )
            )
            start = None

        try:
            end = int(chrom_end)
        except (ValueError, TypeError):
            row_errors.append(
                ValidationError(i, "chromEnd", "End must be an integer", chrom_end)
            )
            end = None

        if start is not None and end is not None:
            # Validate start < end
            if start >= end:
                row_errors.append(
                    ValidationError(
                        i,
                        "coordinates",
                        f"Start ({start}) must be less than end ({end})",
                        {"start": start, "end": end},
                    )
                )

            # Validate start >= 0
            if start < 0:
                row_errors.append(
                    ValidationError(
                        i,
                        "chromStart",
                        f"Start coordinate must be >= 0, got {start}",
                        start,
                    )
                )

            # Validate chromosome matches gene
            chrom_normalized = str(chrom).replace("chr", "").replace("Chr", "")
            if chrom_normalized != gene_chr:
                row_errors.append(
                    ValidationError(
                        i,
                        "chrom",
                        (
                            f"Chromosome '{chrom}' does not match "
                            f"gene chromosome '{gene.get('chromosome')}'"
                        ),
                        chrom,
                    )
                )

            # Validate within gene bounds
            if start < gene_start or end > gene_end:
                row_errors.append(
                    ValidationError(
                        i,
                        "coordinates",
                        (
                            f"Interval ({start}-{end}) is outside "
                            f"gene bounds ({gene_start}-{gene_end})"
                        ),
                        {"start": start, "end": end},
                    )
                )

        score = interval.get("score")
        if score is not None and score != "":
            try:
                score_val = float(score)
                # Scores should be non-negative
                if score_val < 0:
                    row_errors.append(
                        ValidationError(
                            i,
                            "score",
                            f"Score must be non-negative, got {score_val}",
                            score_val,
                        )
                    )
            except (ValueError, TypeError):
                row_errors.append(
                    ValidationError(
                        i, "score", f"Score must be numeric, got '{score}'", score
                    )
                )

        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append(interval)
            warnings.extend(row_warnings)

    return ValidationReport(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        valid_rows=valid_rows,
        total_rows=len(intervals),
    )


def parse_csv_row(row: dict[str, Any], field_mapping: dict[str, str]) -> dict[str, Any]:
    """Map CSV columns to database fields using a field mapping.

    Args:
        row: Raw CSV row dictionary (keys are CSV column names)
        field_mapping: Mapping of database field -> CSV column name

    Returns:
        Dictionary with database field names as keys
    """
    result = {}
    reverse_mapping = {v: k for k, v in field_mapping.items()}

    for csv_key, value in row.items():
        if csv_key in reverse_mapping:
            db_field = reverse_mapping[csv_key]
            result[db_field] = value
        else:
            # Try direct match
            result[csv_key] = value

    return result
