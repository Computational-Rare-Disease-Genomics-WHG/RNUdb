"""Import API endpoints for batch data ingestion."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import csv
import io
import json

from api.models import (
    VariantBatchImportRequest,
    StructureImportRequest,
    BEDTrackImportRequest,
    ValidationReportResponse,
    ImportResult,
    ValidationErrorModel,
)
from api.services.validation import (
    validate_variant_batch,
    validate_structure,
    validate_bed_intervals,
)
from api.routers.auth import require_admin
from rnudb_utils.database import (
    get_db_connection,
    insert_variants,
    insert_structures,
    audit_log,
)

router = APIRouter(tags=["imports"])


def _get_gene(gene_id: str):
    """Get gene from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM genes WHERE id = ?", (gene_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def _get_existing_variant_keys(gene_id: str) -> set:
    """Get existing variant position_ref_alt keys for duplicate detection."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT position, ref, alt FROM variants WHERE geneId = ?",
        (gene_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return {f"{r['position']}_{r['ref']}_{r['alt']}" for r in rows}


def _validation_report_to_response(report) -> ValidationReportResponse:
    """Convert internal ValidationReport to API response model."""
    return ValidationReportResponse(
        valid=report.valid,
        errors=[
            ValidationErrorModel(row=e.row, field=e.field, message=e.message, value=e.value)
            for e in report.errors
        ],
        warnings=[
            ValidationErrorModel(row=e.row, field=e.field, message=e.message, value=e.value)
            for e in report.warnings
        ],
        valid_count=len(report.valid_rows),
        total_count=report.total_rows
    )


@router.post("/imports/variants/validate", response_model=ValidationReportResponse)
async def validate_variant_import(
    request: VariantBatchImportRequest,
    user: dict = Depends(require_admin)
):
    """Validate a batch of variants without importing."""
    gene = _get_gene(request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")
    
    existing = _get_existing_variant_keys(request.geneId)
    report = validate_variant_batch(request.variants, gene, existing)
    return _validation_report_to_response(report)


@router.post("/imports/variants/batch", response_model=ImportResult)
async def import_variant_batch(
    request: VariantBatchImportRequest,
    user: dict = Depends(require_admin)
):
    """Import a batch of validated variants."""
    gene = _get_gene(request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")
    
    existing = _get_existing_variant_keys(request.geneId)
    report = validate_variant_batch(request.variants, gene, existing)
    
    if not report.valid and not request.skip_invalid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed",
                "errors": [
                    {"row": e.row, "field": e.field, "message": e.message}
                    for e in report.errors
                ]
            }
        )
    
    if not report.valid_rows:
        return ImportResult(
            success=False,
            imported_count=0,
            skipped_count=len(report.errors),
            errors=_validation_report_to_response(report).errors,
            warnings=_validation_report_to_response(report).warnings
        )
    
    # Prepare variant data for insertion
    variants_data = []
    for row in report.valid_rows:
        variant = {
            "id": row.get("id") or f"{request.geneId}_{row['position']}_{row['ref']}_{row['alt']}",
            "geneId": request.geneId,
            "position": row["position"],
            "ref": row["ref"],
            "alt": row["alt"],
            "nucleotidePosition": row.get("nucleotidePosition"),
            "hgvs": row.get("hgvs"),
            "consequence": row.get("consequence"),
            "clinvar_significance": row.get("clinvar_significance"),
            "clinical_significance": row.get("clinical_significance"),
            "pmid": row.get("pmid"),
            "function_score": float(row["function_score"]) if row.get("function_score") is not None else None,
            "pvalues": float(row["pvalues"]) if row.get("pvalues") is not None else None,
            "qvalues": float(row["qvalues"]) if row.get("qvalues") is not None else None,
            "depletion_group": row.get("depletion_group"),
            "gnomad_ac": int(row["gnomad_ac"]) if row.get("gnomad_ac") is not None else None,
            "gnomad_hom": int(row["gnomad_hom"]) if row.get("gnomad_hom") is not None else None,
            "aou_ac": int(row["aou_ac"]) if row.get("aou_ac") is not None else None,
            "aou_hom": int(row["aou_hom"]) if row.get("aou_hom") is not None else None,
            "ukbb_ac": int(row["ukbb_ac"]) if row.get("ukbb_ac") is not None else None,
            "ukbb_hom": int(row["ukbb_hom"]) if row.get("ukbb_hom") is not None else None,
            "cadd_score": float(row["cadd_score"]) if row.get("cadd_score") is not None else None,
            "zygosity": row.get("zygosity"),
            "cohort": row.get("cohort") or "curated",
        }
        variants_data.append(variant)
    
    insert_variants(variants_data)
    
    # Audit log
    audit_log(
        "variants", "batch",
        "CREATE", None,
        {"count": len(variants_data), "geneId": request.geneId},
        user.get("github_login", "unknown")
    )
    
    return ImportResult(
        success=True,
        imported_count=len(variants_data),
        skipped_count=len(report.errors),
        errors=_validation_report_to_response(report).errors,
        warnings=_validation_report_to_response(report).warnings
    )


@router.post("/imports/structures/validate", response_model=ValidationReportResponse)
async def validate_structure_import(
    request: StructureImportRequest,
    user: dict = Depends(require_admin)
):
    """Validate an RNA structure without importing."""
    gene = _get_gene(request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")
    
    report = validate_structure(request.structure, gene)
    return _validation_report_to_response(report)


@router.post("/imports/structures", response_model=ImportResult)
async def import_structure(
    request: StructureImportRequest,
    user: dict = Depends(require_admin)
):
    """Import an RNA structure for a gene."""
    gene = _get_gene(request.geneId)
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
                ]
            }
        )
    
    # Build structure data for insertion
    structure_data = [{
        "id": request.structure["id"],
        "geneId": request.geneId,
        "nucleotides": request.structure.get("nucleotides", []),
        "basePairs": request.structure.get("basePairs", []),
        "annotations": request.structure.get("annotations", []),
        "structuralFeatures": request.structure.get("structuralFeatures", [])
    }]
    
    insert_structures(structure_data)
    
    # Audit log
    audit_log(
        "rna_structures", request.structure["id"],
        "CREATE", None,
        {"geneId": request.geneId, "nucleotides": len(request.structure.get("nucleotides", []))},
        user.get("github_login", "unknown")
    )
    
    return ImportResult(
        success=True,
        imported_count=1,
        skipped_count=0,
        errors=[],
        warnings=_validation_report_to_response(report).warnings
    )


@router.post("/imports/bed-tracks/validate", response_model=ValidationReportResponse)
async def validate_bed_import(
    request: BEDTrackImportRequest,
    user: dict = Depends(require_admin)
):
    """Validate BED track intervals without importing."""
    gene = _get_gene(request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")
    
    report = validate_bed_intervals(request.intervals, gene)
    return _validation_report_to_response(report)


@router.post("/imports/bed-tracks", response_model=ImportResult)
async def import_bed_track(
    request: BEDTrackImportRequest,
    user: dict = Depends(require_admin)
):
    """Import a BED track for a gene."""
    gene = _get_gene(request.geneId)
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
                ]
            }
        )
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inserted = 0
    for interval in report.valid_rows:
        cursor.execute(
            """
            INSERT INTO bed_tracks (geneId, track_name, chrom, interval_start, interval_end, label, score, color, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request.geneId,
                request.track_name,
                interval["chrom"],
                int(interval["chromStart"]),
                int(interval["chromEnd"]),
                interval.get("name"),
                float(interval["score"]) if interval.get("score") is not None else None,
                request.color,
                user.get("github_login", "unknown")
            )
        )
        inserted += 1
    
    conn.commit()
    conn.close()
    
    # Audit log
    audit_log(
        "bed_tracks", request.track_name,
        "CREATE", None,
        {"geneId": request.geneId, "intervals": inserted},
        user.get("github_login", "unknown")
    )
    
    return ImportResult(
        success=True,
        imported_count=inserted,
        skipped_count=0,
        errors=[],
        warnings=_validation_report_to_response(report).warnings
    )
