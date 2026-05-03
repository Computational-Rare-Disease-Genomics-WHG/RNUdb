"""Variant API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from api.models import (
    LiteratureCount,
    Variant,
    VariantCreate,
    VariantPublic,
    VariantUpdate,
)
from api.routers.auth import require_admin
from rnudb_utils.database import audit_log, get_db

router = APIRouter()

_ALLOWED_VARIANT_COLUMNS = {
    "position",
    "nucleotidePosition",
    "ref",
    "alt",
    "hgvs",
    "consequence",
    "clinvar_significance",
    "clinical_significance",
    "disease_type",
    "pmid",
    "function_score",
    "pvalues",
    "qvalues",
    "depletion_group",
    "gnomad_ac",
    "gnomad_hom",
    "aou_ac",
    "aou_hom",
    "ukbb_ac",
    "ukbb_hom",
    "cadd_score",
    "zygosity",
    "cohort",
}


@router.get("/variants", response_model=list[VariantPublic])
async def get_all_variants(db: Session = Depends(get_db)):
    """Get all variants"""
    variants = db.execute(select(Variant)).scalars().all()
    return [VariantPublic.model_validate(v) for v in variants]


@router.get("/variants/disease-types")
async def get_distinct_disease_types(db: Session = Depends(get_db)):
    """Get all distinct disease types from variants"""
    rows = db.execute(
        text("""
            SELECT DISTINCT disease_type FROM variants
            WHERE disease_type IS NOT NULL AND disease_type != ''
            ORDER BY disease_type
        """)
    ).fetchall()
    return [row._mapping["disease_type"] for row in rows]


@router.get("/variants/clinical-significances")
async def get_distinct_clinical_significances(db: Session = Depends(get_db)):
    """Get all distinct clinical significances from variants"""
    rows = db.execute(
        text("""
            SELECT DISTINCT clinical_significance FROM variants
            WHERE clinical_significance IS NOT NULL AND clinical_significance != ''
            ORDER BY clinical_significance
        """)
    ).fetchall()
    return [row._mapping["clinical_significance"] for row in rows]


@router.get("/variants/{variant_id}", response_model=VariantPublic)
async def get_variant(variant_id: str, db: Session = Depends(get_db)):
    """Get a specific variant"""
    variant = db.get(Variant, variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return VariantPublic.model_validate(variant)


@router.post("/variants", response_model=VariantPublic)
async def create_variant(
    variant: VariantCreate, request: Request, db: Session = Depends(get_db),
):
    """Create a new variant (curator only)"""
    user = require_admin(request)

    if db.get(Variant, variant.id):
        raise HTTPException(
            status_code=409, detail=f"Variant {variant.id} already exists"
        )

    new_variant = Variant.model_validate(variant)
    db.add(new_variant)
    db.commit()
    db.refresh(new_variant)

    audit_log(
        "variants",
        variant.id,
        "CREATE",
        None,
        variant.model_dump(),
        user["github_login"],
    )

    return VariantPublic.model_validate(new_variant)


@router.put("/variants/{variant_id}", response_model=VariantPublic)
async def update_variant(
    variant_id: str,
    variant: VariantUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Update a variant (curator only)"""
    user = require_admin(request)

    existing = db.get(Variant, variant_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")

    old_values = existing.model_dump()

    for field, value in variant.model_dump(exclude_unset=True).items():
        if field in _ALLOWED_VARIANT_COLUMNS:
            setattr(existing, field, value)

    db.commit()

    audit_log(
        "variants",
        variant_id,
        "UPDATE",
        old_values,
        variant.model_dump(exclude_unset=True),
        user["github_login"],
    )

    updated = db.get(Variant, variant_id)
    return VariantPublic.model_validate(updated)


@router.delete("/variants/{variant_id}")
async def delete_variant(
    variant_id: str, request: Request, db: Session = Depends(get_db)
):
    """Delete a variant (curator only)"""
    user = require_admin(request)

    existing = db.get(Variant, variant_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")

    old_values = existing.model_dump()

    db.delete(existing)
    db.commit()

    audit_log("variants", variant_id, "DELETE", old_values, None, user["github_login"])

    return {"message": f"Variant {variant_id} deleted"}


@router.get("/literature-counts", response_model=list[LiteratureCount])
async def get_literature_counts(db: Session = Depends(get_db)):
    """Get all literature counts linking variants to literature"""
    counts = db.execute(select(LiteratureCount)).scalars().all()
    return [LiteratureCount.model_validate(c) for c in counts]
