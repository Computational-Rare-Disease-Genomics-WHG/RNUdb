"""Import API endpoints for batch data ingestion."""

import re as regex_lib

import requests
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.models import (
    BEDTrackImportRequest,
    Gene,
    ImportResult,
    Literature,
    StructureImportRequest,
    ValidationErrorModel,
    ValidationReportResponse,
    Variant,
    VariantBatchImportRequest,
    VariantClassification,
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
from rnudb_utils.vcf_parser import parse_vcf, validate_vcf_content

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
        chrom = row.get("chrom", "chr12")
        variant = {
            "id": row.get("id")
            or f"{chrom}-{row['position']}-{row['ref']}-{row['alt']}",
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

    insert_variants(variants_data, db)

    audit_log(
        "variants",
        "batch",
        "CREATE",
        None,
        {"count": len(variants_data), "geneId": request.geneId},
        "system",
        db,
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

    insert_structures(structure_data, db)

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
        db,
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
        db,
    )

    return ImportResult(
        success=True,
        imported_count=inserted,
        skipped_count=0,
        errors=[],
        warnings=_validation_report_to_response(report).warnings,
    )


class VCFImportRequest(BaseModel):
    geneId: str


class ClassificationCSVRow(BaseModel):
    variant_id: str
    paper_id: str
    clinical_significance: str | None = None
    zygosity: str | None = None
    disease: str | None = None
    counts: int | None = None
    linked_variant_ids: str | None = None
    clinvar_significance: str | None = None


class ClassificationImportRequest(BaseModel):
    geneId: str
    classifications: list[ClassificationCSVRow]


class PubMedLookupResult(BaseModel):
    doi: str
    success: bool
    pmid: str | None = None
    title: str | None = None
    authors: str | None = None
    journal: str | None = None
    year: str | None = None
    url: str | None = None
    error: str | None = None


def _fetch_pubmed_metadata(doi: str) -> PubMedLookupResult:
    """Fetch metadata from CrossRef API using DOI."""
    try:
        url = f"https://api.crossref.org/works/{doi}"
        response = requests.get(url, timeout=15, headers={"Accept": "application/json"})

        if response.status_code == 200:
            data = response.json().get("message", {})

            authors = []
            for author in data.get("author", []):
                family = author.get("family", "")
                given = author.get("given", "")
                if family or given:
                    authors.append(f"{family} {given}".strip())

            year = None
            if data.get("published-print") or data.get("published-online"):
                date_parts = (
                    data.get("published-print") or data.get("published-online")
                ).get("date-parts", [[None]])
                if date_parts and date_parts[0]:
                    year = str(date_parts[0][0])
            elif data.get("created"):
                date_parts = data.get("created", {}).get("date-parts", [[None]])
                if date_parts and date_parts[0]:
                    year = str(date_parts[0][0])

            return PubMedLookupResult(
                doi=doi,
                success=True,
                pmid=None,
                title=data.get("title", [""])[0] if data.get("title") else None,
                authors=", ".join(authors),
                journal=data.get("container-title", [""])[0]
                if data.get("container-title")
                else data.get("journal", ""),
                year=year,
                url=data.get("URL"),
            )
        elif response.status_code == 404:
            return PubMedLookupResult(doi=doi, success=False, error="DOI not found")
        else:
            return PubMedLookupResult(
                doi=doi,
                success=False,
                error=f"API error: {response.status_code}",
            )
    except requests.exceptions.RequestException as e:
        return PubMedLookupResult(
            doi=doi, success=False, error=f"Network error: {str(e)}"
        )
    except Exception as e:
        return PubMedLookupResult(doi=doi, success=False, error=f"Error: {str(e)}")


@router.post("/imports/variants/vcf")
async def import_variants_vcf(
    geneId: str,
    file: UploadFile = File(...),
    field_mappings: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """Import variants from a VCF file with optional field mappings."""
    gene = _get_gene(geneId, db)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {geneId} not found")

    content = await file.read()
    vcf_content = content.decode("utf-8")

    is_valid, errors = validate_vcf_content(vcf_content)
    if not is_valid:
        raise HTTPException(
            status_code=400, detail={"message": "Invalid VCF", "errors": errors}
        )

    mappings = None
    if field_mappings:
        try:
            import json

            mappings = json.loads(field_mappings)
        except json.JSONDecodeError:
            pass

    variants = parse_vcf(vcf_content, field_mappings=mappings)

    if not variants:
        return ImportResult(
            success=True,
            imported_count=0,
            skipped_count=0,
            errors=[],
            warnings=[
                ValidationErrorModel(
                    row=0, field="file", message="No variants found in VCF"
                )
            ],
        )

    existing = _get_existing_variant_keys(geneId, db)
    imported_count = 0
    skipped_count = 0
    id_pattern = regex_lib.compile(r"^chr\d+-\d+-[ATCGatcg]+-[ATCGatcg]+$")

    for variant in variants:
        chrom = variant.get("chrom", "chr12")
        variant_id = (
            variant.get("id")
            or f"{chrom}-{variant['pos']}-{variant['ref']}-{variant['alt']}"
        )

        if not id_pattern.match(variant_id):
            skipped_count += 1
            continue

        db.execute(
            text("""
                INSERT INTO variants
                (id, geneId, position, ref, alt, nucleotidePosition, hgvs, function_score, pvalues, qvalues,
                 depletion_group, gnomad_ac, gnomad_hom, aou_ac, aou_hom, cadd_score)
                VALUES
                (:id, :geneId, :position, :ref, :alt, :nucleotidePosition, :hgvs, :function_score, :pvalues, :qvalues,
                 :depletion_group, :gnomad_ac, :gnomad_hom, :aou_ac, :aou_hom, :cadd_score)
                ON CONFLICT(id) DO UPDATE SET
                    hgvs = EXCLUDED.hgvs,
                    nucleotidePosition = EXCLUDED.nucleotidePosition,
                    function_score = COALESCE(EXCLUDED.function_score, variants.function_score),
                    pvalues = COALESCE(EXCLUDED.pvalues, variants.pvalues),
                    qvalues = COALESCE(EXCLUDED.qvalues, variants.qvalues),
                    depletion_group = COALESCE(EXCLUDED.depletion_group, variants.depletion_group),
                    gnomad_ac = COALESCE(EXCLUDED.gnomad_ac, variants.gnomad_ac),
                    gnomad_hom = COALESCE(EXCLUDED.gnomad_hom, variants.gnomad_hom),
                    aou_ac = COALESCE(EXCLUDED.aou_ac, variants.aou_ac),
                    aou_hom = COALESCE(EXCLUDED.aou_hom, variants.aou_hom),
                    cadd_score = COALESCE(EXCLUDED.cadd_score, variants.cadd_score)
            """),
            {
                "id": variant_id,
                "geneId": geneId,
                "position": variant["pos"],
                "ref": variant["ref"],
                "alt": variant["alt"],
                "nucleotidePosition": variant.get("nucleotidePosition"),
                "hgvs": variant.get("hgvs"),
                "function_score": variant.get("function_score"),
                "pvalues": variant.get("pvalues"),
                "qvalues": variant.get("qvalues"),
                "depletion_group": variant.get("depletion_group"),
                "gnomad_ac": variant.get("gnomad_ac"),
                "gnomad_hom": variant.get("gnomad_hom"),
                "aou_ac": variant.get("aou_ac"),
                "aou_hom": variant.get("aou_hom"),
                "cadd_score": variant.get("cadd_score"),
            },
        )
        imported_count += 1

    db.commit()

    audit_log(
        "variants",
        "vcf_import",
        "CREATE",
        None,
        {"count": imported_count, "geneId": geneId, "file": file.filename},
        "system",
        db,
    )

    return ImportResult(
        success=True,
        imported_count=imported_count,
        skipped_count=skipped_count,
        errors=[],
        warnings=[],
    )


@router.post(
    "/imports/variants/classifications", response_model=list[PubMedLookupResult]
)
async def import_variant_classifications(
    request: ClassificationImportRequest, db: Session = Depends(get_db)
):
    """Import variant classifications from CSV data with optional PubMed lookup."""
    results: list[PubMedLookupResult] = []
    dois_to_lookup: dict[str, ClassificationCSVRow] = {}

    for idx, row in enumerate(request.classifications):
        variant = db.get(Variant, row.variant_id)
        if not variant:
            results.append(
                PubMedLookupResult(
                    doi=row.paper_id,
                    success=False,
                    error=f"Variant {row.variant_id} not found",
                )
            )
            continue

        literature = db.get(Literature, row.paper_id)
        if not literature:
            dois_to_lookup[row.paper_id] = row

        classification = VariantClassification(
            variant_id=row.variant_id,
            literature_id=row.paper_id,
            clinical_significance=row.clinical_significance,
            zygosity=row.zygosity,
            disease=row.disease,
            counts=row.counts,
            linked_variant_ids=row.linked_variant_ids,
            clinvar_significance=row.clinvar_significance,
        )
        db.add(classification)

        results.append(
            PubMedLookupResult(
                doi=row.paper_id,
                success=True,
            )
        )

    db.commit()

    for doi, classification_row in dois_to_lookup.items():
        lookup_result = _fetch_pubmed_metadata(doi)

        if lookup_result.success:
            literature = Literature(
                id=doi,
                title=lookup_result.title or "Unknown",
                authors=lookup_result.authors or "Unknown",
                journal=lookup_result.journal or "Unknown",
                year=lookup_result.year or "Unknown",
                doi=doi,
                pmid=lookup_result.pmid,
                url=lookup_result.url,
            )
            db.add(literature)
            db.commit()

            for i, r in enumerate(results):
                if r.doi == doi and not r.success:
                    results[i] = lookup_result
                    break
        else:
            literature = Literature(
                id=doi,
                title=f"DOI: {doi}",
                authors="Unknown",
                journal="Unknown",
                year="Unknown",
                doi=doi,
            )
            db.add(literature)
            db.commit()

    audit_log(
        "variant_classifications",
        "batch",
        "CREATE",
        None,
        {"count": len(request.classifications), "geneId": request.geneId},
        "system",
        db,
    )

    return results


@router.post("/imports/literature/lookup")
async def lookup_literature_metadata(
    dois: list[str], db: Session = Depends(get_db)
) -> list[PubMedLookupResult]:
    """Lookup metadata from PubMed for a list of DOIs."""
    results = []

    for doi in dois:
        existing = db.get(Literature, doi)
        if existing:
            results.append(
                PubMedLookupResult(
                    doi=doi,
                    success=True,
                    pmid=existing.pmid,
                    title=existing.title,
                    authors=existing.authors,
                    journal=existing.journal,
                    year=existing.year,
                    url=existing.url,
                )
            )
            continue

        lookup_result = _fetch_pubmed_metadata(doi)

        if lookup_result.success:
            literature = Literature(
                id=doi,
                title=lookup_result.title or "Unknown",
                authors=lookup_result.authors or "Unknown",
                journal=lookup_result.journal or "Unknown",
                year=lookup_result.year or "Unknown",
                doi=doi,
                pmid=lookup_result.pmid,
                url=lookup_result.url,
            )
            db.add(literature)
            db.commit()
        else:
            literature = Literature(
                id=doi,
                title=f"DOI: {doi}",
                authors="Unknown",
                journal="Unknown",
                year="Unknown",
                doi=doi,
            )
            db.add(literature)
            db.commit()

        results.append(lookup_result)

    return results


@router.post("/imports/literature/fetch")
async def fetch_literature_metadata(
    request: Request,
    db: Session = Depends(get_db),
) -> PubMedLookupResult:
    """Fetch metadata from PubMed using DOI or PMID."""
    body = await request.json()
    identifier = body.get("identifier", "").strip()

    if not identifier:
        return PubMedLookupResult(doi="", success=False, error="Identifier is required")

    if identifier.startswith("https://doi.org/"):
        identifier = identifier.replace("https://doi.org/", "")
    elif identifier.startswith("http://doi.org/"):
        identifier = identifier.replace("http://doi.org/", "")
    elif identifier.startswith("doi.org/"):
        identifier = identifier.replace("doi.org/", "")

    existing = db.get(Literature, identifier)
    if existing:
        return PubMedLookupResult(
            doi=identifier,
            success=True,
            pmid=existing.pmid,
            title=existing.title,
            authors=existing.authors,
            journal=existing.journal,
            year=existing.year,
            url=existing.url,
        )

    result = _fetch_pubmed_metadata(identifier)

    if result.success:
        lit = Literature(
            id=identifier,
            title=result.title or "Unknown",
            authors=result.authors or "Unknown",
            journal=result.journal or "Unknown",
            year=result.year or "Unknown",
            doi=identifier,
            pmid=result.pmid,
            url=result.url,
        )
        db.add(lit)
        db.commit()

    return result
