"""Shared import execution used by the imports router and approval apply.

Keeping the actual mutation logic here (rather than inside the routers) means
the approval workflow's ``import`` action executes through the exact same code
path as the direct import endpoints, so behavior cannot drift.
"""

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.models import (
    Gene,
    ImportResult,
    Literature,
    RNAStructure,
    ValidationErrorModel,
    ValidationReportResponse,
)
from api.services.validation import (
    validate_bed_intervals,
    validate_structure,
    validate_variant_batch,
)
from rnudb_utils.database import (
    audit_log,
    insert_structures,
    insert_variants,
)


def get_gene(db: Session, gene_id: str) -> dict | None:
    """Get gene from database."""
    gene = db.get(Gene, gene_id)
    return gene.model_dump() if gene else None


def get_existing_variant_keys(db: Session, gene_id: str) -> set[str]:
    """Get existing variant position_ref_alt keys for duplicate detection."""
    rows = db.execute(
        text("SELECT position, ref, alt FROM variants WHERE geneId = :gene_id"),
        {"gene_id": gene_id},
    ).fetchall()
    return {
        f"{r._mapping['position']}_{r._mapping['ref']}_{r._mapping['alt']}"
        for r in rows
    }


def report_to_response(report) -> ValidationReportResponse:
    """Convert internal ValidationReport to API response model."""
    return ValidationReportResponse(
        valid=report.valid,
        errors=[
            ValidationErrorModel(
                row=e.row, field=e.field, message=e.message, value=e.value
            )
            for e in report.errors
        ],
        warnings=[
            ValidationErrorModel(
                row=e.row, field=e.field, message=e.message, value=e.value
            )
            for e in report.warnings
        ],
        valid_count=len(report.valid_rows),
        total_count=report.total_rows,
    )


def exec_variant_batch(
    db: Session,
    gene_id: str,
    variants: list[dict],
    skip_invalid: bool,
    created_by: str,
) -> ImportResult:
    """Validate and insert a batch of variants. Raises on hard failures."""
    gene = get_gene(db, gene_id)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {gene_id} not found")

    existing = get_existing_variant_keys(db, gene_id)
    report = validate_variant_batch(variants, gene, existing)

    if not report.valid and not skip_invalid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed",
                "errors": [
                    {"row": e.row, "field": e.field, "message": e.message}
                    for e in report.errors
                ],
            },
        )

    response = report_to_response(report)
    if not report.valid_rows:
        return ImportResult(
            success=False,
            imported_count=0,
            skipped_count=len(report.errors),
            errors=response.errors,
            warnings=response.warnings,
        )

    variants_data = []
    for row in report.valid_rows:
        chrom = row.get("chrom", "chr12")
        variant = {
            "id": row.get("id")
            or f"{chrom}-{row['position']}-{row['ref']}-{row['alt']}",
            "geneId": gene_id,
            "position": row["position"],
            "ref": row["ref"],
            "alt": row["alt"],
            "nucleotidePosition": row.get("nucleotidePosition"),
            "hgvs": row.get("hgvs"),
            "consequence": row.get("consequence"),
            "clinical_significance": row.get("clinical_significance"),
            "pmid": row.get("pmid"),
            "function_score": float(row["function_score"])
            if row.get("function_score") is not None
            else None,
            "pvalues": float(row["pvalues"])
            if row.get("pvalues") is not None
            else None,
            "qvalues": float(row["qvalues"])
            if row.get("qvalues") is not None
            else None,
            "depletion_group": row.get("depletion_group"),
            "gnomad_ac": int(row["gnomad_ac"])
            if row.get("gnomad_ac") is not None
            else None,
            "gnomad_hom": int(row["gnomad_hom"])
            if row.get("gnomad_hom") is not None
            else None,
            "aou_ac": int(row["aou_ac"]) if row.get("aou_ac") is not None else None,
            "aou_hom": int(row["aou_hom"]) if row.get("aou_hom") is not None else None,
            "ukbb_ac": int(row["ukbb_ac"]) if row.get("ukbb_ac") is not None else None,
            "ukbb_hom": int(row["ukbb_hom"])
            if row.get("ukbb_hom") is not None
            else None,
            "zygosity": row.get("zygosity"),
            "cohort": row.get("cohort") or "curated",
        }
        variants_data.append(variant)

    insert_variants(variants_data, db)

    audit_log(
        "variants",
        "batch",
        "CREATE",
        None,
        {"count": len(variants_data), "geneId": gene_id},
        created_by,
        db,
    )

    return ImportResult(
        success=True,
        imported_count=len(variants_data),
        skipped_count=len(report.errors),
        errors=response.errors,
        warnings=response.warnings,
    )


def exec_structure_import(
    db: Session,
    gene_id: str,
    structure: dict,
    created_by: str,
) -> ImportResult:
    """Validate and insert an RNA structure."""
    gene = get_gene(db, gene_id)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {gene_id} not found")

    report = validate_structure(structure, gene)

    if not report.valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Structure validation failed",
                "errors": [
                    {"row": e.row, "field": e.field, "message": e.message}
                    for e in report.errors
                ],
            },
        )

    existing = db.get(RNAStructure, structure["id"])
    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "message": (
                    f"Structure '{structure['id']}' already exists"
                    f" for gene {existing.geneId}."
                    " Delete it first or use a different ID."
                ),
                "existing_id": structure["id"],
                "gene_id": existing.geneId,
            },
        )

    structure_data = [
        {
            "id": structure["id"],
            "geneId": gene_id,
            "nucleotides": structure.get("nucleotides", []),
            "base_pairs": structure.get("base_pairs", []),
            "annotations": structure.get("annotations", []),
            "structural_features": structure.get("structural_features", []),
        }
    ]

    insert_structures(structure_data, db)

    audit_log(
        "rna_structures",
        structure["id"],
        "CREATE",
        None,
        {
            "geneId": gene_id,
            "nucleotides": len(structure.get("nucleotides", [])),
        },
        created_by,
        db,
    )

    return ImportResult(
        success=True,
        imported_count=1,
        skipped_count=0,
        errors=[],
        warnings=report_to_response(report).warnings,
    )


def exec_literature_bulk_import(
    db: Session,
    literature: list[dict],
    created_by: str,
) -> dict:
    """Validate and insert literature rows in bulk (mirrors /literature/bulk)."""
    import re as regex_lib

    imported_count = 0
    skipped_count = 0
    errors: list[dict] = []

    for idx, lit_data in enumerate(literature):
        try:
            doi = lit_data.get("doi", "").strip()
            title = lit_data.get("title", "").strip()
            authors = lit_data.get("authors", "").strip()
            journal = lit_data.get("journal", "").strip()
            year = lit_data.get("year", "").strip()

            row_errors: list[dict] = []
            if not doi:
                row_errors.append({"field": "doi", "message": "DOI is required"})
            if not title:
                row_errors.append({"field": "title", "message": "Title is required"})
            if not authors:
                row_errors.append(
                    {"field": "authors", "message": "Authors is required"}
                )
            if not journal:
                row_errors.append(
                    {"field": "journal", "message": "Journal is required"}
                )
            if not year:
                row_errors.append({"field": "year", "message": "Year is required"})
            elif not regex_lib.match(r"^\d{4}$", year):
                row_errors.append(
                    {"field": "year", "message": "Year must be a 4-digit number"}
                )

            if row_errors:
                for err in row_errors:
                    errors.append(
                        {
                            "row": idx + 2,
                            "field": err["field"],
                            "message": err["message"],
                        }
                    )
                skipped_count += 1
                continue

            existing = db.get(Literature, doi)
            if existing:
                skipped_count += 1
                continue

            new_lit = Literature(
                id=doi,
                title=title or "Unknown",
                authors=authors or "Unknown",
                journal=journal or "Unknown",
                year=year or "Unknown",
                doi=doi,
                pmid=lit_data.get("pmid", "").strip() or None,
                url=lit_data.get("url", "").strip() or None,
            )
            db.add(new_lit)
            imported_count += 1

        except (ValueError, TypeError, KeyError) as e:
            errors.append({"row": idx + 2, "field": "unknown", "message": str(e)})
            skipped_count += 1

    db.commit()

    audit_log(
        "literature",
        "bulk_import",
        "CREATE",
        None,
        {
            "imported": imported_count,
            "skipped": skipped_count,
            "created_by": created_by,
        },
        created_by,
        db,
    )

    return {
        "success": True,
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "errors": errors,
    }


def exec_bed_track_import(
    db: Session,
    gene_id: str,
    track_name: str,
    intervals: list[dict],
    color: str | None,
    created_by: str,
) -> ImportResult:
    """Validate and insert BED track intervals."""
    gene = get_gene(db, gene_id)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {gene_id} not found")

    report = validate_bed_intervals(intervals, gene)

    if not report.valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "BED track validation failed",
                "errors": [
                    {"row": e.row, "field": e.field, "message": e.message}
                    for e in report.errors
                ],
            },
        )

    inserted = 0
    for interval in report.valid_rows:
        db.execute(
            text("""
                INSERT INTO bed_tracks
                    (geneId, track_name, chrom, interval_start, interval_end,
                     label, score, color, created_by)
                VALUES
                    (:geneId, :track_name, :chrom, :interval_start, :interval_end,
                     :label, :score, :color, :created_by)
            """),
            {
                "geneId": gene_id,
                "track_name": track_name,
                "chrom": interval["chrom"],
                "interval_start": int(interval["chromStart"]),
                "interval_end": int(interval["chromEnd"]),
                "label": interval.get("name"),
                "score": float(interval["score"])
                if interval.get("score") is not None
                else None,
                "color": color,
                "created_by": created_by,
            },
        )
        inserted += 1

    db.commit()

    audit_log(
        "bed_tracks",
        track_name,
        "CREATE",
        None,
        {"geneId": gene_id, "intervals": inserted},
        created_by,
        db,
    )

    return ImportResult(
        success=True,
        imported_count=inserted,
        skipped_count=0,
        errors=[],
        warnings=report_to_response(report).warnings,
    )
