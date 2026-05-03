"""Import API endpoints for batch data ingestion."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.models import (
    BEDTrackImportRequest,
    Gene,
    ImportResult,
    StructureImportRequest,
    ValidationErrorModel,
    ValidationReportResponse,
    VariantBatchImportRequest,
)
from api.services.validation import (
    validate_bed_intervals,
    validate_structure,
    validate_variant_batch,
)
from rnudb_utils.database import (
    audit_log,
    get_db,
    insert_structures,
    insert_variants,
)

router = APIRouter(tags=["imports"])


def _get_gene(gene_id: str, db: Session) -> dict | None:
    """Get gene from database."""
    gene = db.get(Gene, gene_id)
    return gene.model_dump() if gene else None


def _get_existing_variant_keys(gene_id: str, db: Session) -> set:
    """Get existing variant position_ref_alt keys for duplicate detection."""
    rows = db.execute(
        text("SELECT position, ref, alt FROM variants WHERE geneId = :gene_id"),
        {"gene_id": gene_id},
    ).fetchall()
    return {
        f"{r._mapping['position']}_{r._mapping['ref']}_{r._mapping['alt']}"
        for r in rows
    }


def _validation_report_to_response(report) -> ValidationReportResponse:
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


@router.post("/imports/variants/validate", response_model=ValidationReportResponse)
async def validate_variant_import(
    request: VariantBatchImportRequest, db: Session = Depends(get_db)
):
    """Validate a batch of variants without importing."""
    gene = _get_gene(request.geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    existing = _get_existing_variant_keys(request.geneId, db)
    report = validate_variant_batch(request.variants, gene, existing)
    return _validation_report_to_response(report)


@router.post("/imports/variants/batch", response_model=ImportResult)
async def import_variant_batch(
    request: VariantBatchImportRequest, db: Session = Depends(get_db)
):
    """Import a batch of validated variants."""
    gene = _get_gene(request.geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    existing = _get_existing_variant_keys(request.geneId, db)
    report = validate_variant_batch(request.variants, gene, existing)

    if not report.valid and not request.skip_invalid:
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

    if not report.valid_rows:
        return ImportResult(
            success=False,
            imported_count=0,
            skipped_count=len(report.errors),
            errors=_validation_report_to_response(report).errors,
            warnings=_validation_report_to_response(report).warnings,
        )

    # Prepare variant data for insertion
    variants_data = []
    for row in report.valid_rows:
        variant = {
            "id": row.get("id")
            or f"{request.geneId}_{row['position']}_{row['ref']}_{row['alt']}",
            "geneId": request.geneId,
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
            "cadd_score": float(row["cadd_score"])
            if row.get("cadd_score") is not None
            else None,
            "zygosity": row.get("zygosity"),
            "cohort": row.get("cohort") or "curated",
        }
        variants_data.append(variant)

    insert_variants(variants_data)

    audit_log(
        "variants",
        "batch",
        "CREATE",
        None,
        {"count": len(variants_data), "geneId": request.geneId},
        "system",
    )

    return ImportResult(
        success=True,
        imported_count=len(variants_data),
        skipped_count=len(report.errors),
        errors=_validation_report_to_response(report).errors,
        warnings=_validation_report_to_response(report).warnings,
    )


@router.post("/imports/structures/validate", response_model=ValidationReportResponse)
async def validate_structure_import(
    request: StructureImportRequest, db: Session = Depends(get_db)
):
    """Validate an RNA structure without importing."""
    gene = _get_gene(request.geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    report = validate_structure(request.structure, gene)
    return _validation_report_to_response(report)


@router.post("/imports/structures", response_model=ImportResult)
async def import_structure(
    request: StructureImportRequest, db: Session = Depends(get_db)
):
    """Import an RNA structure for a gene."""
    gene = _get_gene(request.geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    report = validate_structure(request.structure, gene)

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

    structure_data = [
        {
            "id": request.structure["id"],
            "geneId": request.geneId,
            "nucleotides": request.structure.get("nucleotides", []),
            "base_pairs": request.structure.get("base_pairs", []),
            "annotations": request.structure.get("annotations", []),
            "structural_features": request.structure.get("structural_features", []),
        }
    ]

    insert_structures(structure_data)

    audit_log(
        "rna_structures",
        request.structure["id"],
        "CREATE",
        None,
        {
            "geneId": request.geneId,
            "nucleotides": len(request.structure.get("nucleotides", [])),
        },
        "system",
    )

    return ImportResult(
        success=True,
        imported_count=1,
        skipped_count=0,
        errors=[],
        warnings=_validation_report_to_response(report).warnings,
    )


@router.post("/imports/bed-tracks/validate", response_model=ValidationReportResponse)
async def validate_bed_import(
    request: BEDTrackImportRequest, db: Session = Depends(get_db)
):
    """Validate BED track intervals without importing."""
    gene = _get_gene(request.geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    report = validate_bed_intervals(request.intervals, gene)
    return _validation_report_to_response(report)


@router.post("/imports/bed-tracks", response_model=ImportResult)
async def import_bed_track(
    request: BEDTrackImportRequest, db: Session = Depends(get_db)
):
    """Import a BED track for a gene."""
    gene = _get_gene(request.geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    report = validate_bed_intervals(request.intervals, gene)

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
                "geneId": request.geneId,
                "track_name": request.track_name,
                "chrom": interval["chrom"],
                "interval_start": int(interval["chromStart"]),
                "interval_end": int(interval["chromEnd"]),
                "label": interval.get("name"),
                "score": float(interval["score"])
                if interval.get("score") is not None
                else None,
                "color": request.color,
                "created_by": "system",
            },
        )
        inserted += 1

    db.commit()

    audit_log(
        "bed_tracks",
        request.track_name,
        "CREATE",
        None,
        {"geneId": request.geneId, "intervals": inserted},
        "system",
    )

    return ImportResult(
        success=True,
        imported_count=inserted,
        skipped_count=0,
        errors=[],
        warnings=_validation_report_to_response(report).warnings,
    )
