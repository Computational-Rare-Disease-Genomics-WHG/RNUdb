"""Import API endpoints for batch data ingestion."""

import re as regex_lib

import requests
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.models import (
    BEDTrackImportRequest,
    ImportResult,
    Literature,
    RNAStructure,
    StructureImportRequest,
    ValidationErrorModel,
    ValidationReportResponse,
    Variant,
    VariantBatchImportRequest,
    VariantClassification,
)
from api.routers.auth import require_curator
from api.services.import_ops import (
    exec_bed_track_import,
    exec_structure_import,
    exec_variant_batch,
    get_existing_variant_keys,
    get_gene,
    report_to_response,
)
from api.services.validation import (
    validate_bed_intervals,
    validate_structure,
    validate_variant_batch,
)
from rnudb_utils.database import (
    audit_log,
    get_db,
)
from rnudb_utils.vcf_parser import parse_vcf, validate_vcf_content

router = APIRouter(tags=["imports"])


@router.post("/imports/variants/validate", response_model=ValidationReportResponse)
async def validate_variant_import(
    request: VariantBatchImportRequest, db: Session = Depends(get_db)
):
    """Validate a batch of variants without importing."""
    gene = get_gene(db, request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    existing = get_existing_variant_keys(db, request.geneId)
    report = validate_variant_batch(request.variants, gene, existing)
    return report_to_response(report)


@router.post("/imports/variants/batch", response_model=ImportResult)
async def import_variant_batch(
    request: VariantBatchImportRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_curator),
):
    """Import a batch of validated variants (curator only)."""
    return exec_variant_batch(
        db,
        request.geneId,
        request.variants,
        request.skip_invalid,
        user["github_login"],
    )


@router.post("/imports/structures/validate", response_model=ValidationReportResponse)
async def validate_structure_import(
    request: StructureImportRequest, db: Session = Depends(get_db)
):
    """Validate an RNA structure without importing."""
    gene = get_gene(db, request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    report = validate_structure(request.structure, gene)
    response = report_to_response(report)
    existing = db.get(RNAStructure, request.structure["id"])
    if existing:
        response.warnings.append(
            ValidationErrorModel(
                row=0,
                field="id",
                message=(
                    f"Structure '{request.structure['id']}' already exists"
                    f" for gene {existing.geneId}."
                    " Importing will overwrite the existing structure."
                ),
                value=request.structure["id"],
            )
        )
    return response


@router.post("/imports/structures", response_model=ImportResult)
async def import_structure(
    request: StructureImportRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_curator),
):
    """Import an RNA structure for a gene (curator only)."""
    return exec_structure_import(
        db, request.geneId, request.structure, user["github_login"]
    )


@router.post("/imports/bed-tracks/validate", response_model=ValidationReportResponse)
async def validate_bed_import(
    request: BEDTrackImportRequest, db: Session = Depends(get_db)
):
    """Validate BED track intervals without importing."""
    gene = get_gene(db, request.geneId)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene {request.geneId} not found")

    report = validate_bed_intervals(request.intervals, gene)
    return report_to_response(report)


@router.post("/imports/bed-tracks", response_model=ImportResult)
async def import_bed_track(
    request: BEDTrackImportRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_curator),
):
    """Import a BED track for a gene (curator only)."""
    return exec_bed_track_import(
        db,
        request.geneId,
        request.track_name,
        request.intervals,
        request.color,
        user["github_login"],
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
    except (ValueError, KeyError, TypeError, IndexError) as e:
        return PubMedLookupResult(
            doi=doi, success=False, error=f"Failed to parse response: {str(e)}"
        )


@router.post("/imports/variants/vcf")
async def import_variants_vcf(
    geneId: str,
    file: UploadFile = File(...),
    field_mappings: str | None = Form(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_curator),
):
    """Import variants from a VCF file with optional field mappings (curator only)."""
    gene = get_gene(db, geneId)
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
        import json

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

    get_existing_variant_keys(db, geneId)
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
                (id, geneId, position, ref, alt, nucleotidePosition, hgvs,
                 function_score, pvalues, qvalues, depletion_group,
                 gnomad_ac, gnomad_hom, gnomad_af, aou_ac, aou_hom, aou_af)
                VALUES
                (:id, :geneId, :position, :ref, :alt, :nucleotidePosition,
                 :hgvs, :function_score, :pvalues, :qvalues, :depletion_group,
                 :gnomad_ac, :gnomad_hom, :gnomad_af, :aou_ac, :aou_hom, :aou_af)
                ON CONFLICT(id) DO UPDATE SET
                     hgvs = EXCLUDED.hgvs,
                     nucleotidePosition = EXCLUDED.nucleotidePosition,
                     function_score = COALESCE(
                         EXCLUDED.function_score, variants.function_score
                     ),
                     pvalues = COALESCE(EXCLUDED.pvalues, variants.pvalues),
                     qvalues = COALESCE(EXCLUDED.qvalues, variants.qvalues),
                     depletion_group = COALESCE(
                         EXCLUDED.depletion_group, variants.depletion_group
                     ),
                     gnomad_ac = COALESCE(EXCLUDED.gnomad_ac, variants.gnomad_ac),
                     gnomad_hom = COALESCE(EXCLUDED.gnomad_hom, variants.gnomad_hom),
                     gnomad_af = COALESCE(EXCLUDED.gnomad_af, variants.gnomad_af),
                     aou_ac = COALESCE(EXCLUDED.aou_ac, variants.aou_ac),
                     aou_hom = COALESCE(EXCLUDED.aou_hom, variants.aou_hom),
                     aou_af = COALESCE(EXCLUDED.aou_af, variants.aou_af)
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
                "gnomad_af": variant.get("gnomad_af"),
                "aou_ac": variant.get("aou_ac"),
                "aou_hom": variant.get("aou_hom"),
                "aou_af": variant.get("aou_af"),
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
        user["github_login"],
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
    request: ClassificationImportRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_curator),
):
    """Import variant classifications from CSV (curator only)."""
    results: list[PubMedLookupResult] = []
    dois_to_lookup: dict[str, ClassificationCSVRow] = {}

    for _idx, row in enumerate(request.classifications):
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

    for doi, _classification_row in dois_to_lookup.items():
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
        user["github_login"],
        db,
    )

    return results


@router.post("/imports/literature/lookup")
async def lookup_literature_metadata(
    dois: list[str],
    db: Session = Depends(get_db),
    user: dict = Depends(require_curator),
) -> list[PubMedLookupResult]:
    """Lookup metadata from PubMed for a list of DOIs (curator only)."""
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
    user: dict = Depends(require_curator),
) -> PubMedLookupResult:
    """Fetch metadata from PubMed using DOI or PMID (curator only)."""
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
