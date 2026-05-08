"""Variant API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from api.models import (
    Literature,
    Variant,
    VariantClassification,
    VariantClassificationCreate,
    VariantClassificationPublic,
    VariantCreate,
    VariantPublic,
    VariantUpdate,
)
from api.routers.auth import require_admin, require_curator
from rnudb_utils.database import audit_log, get_db

router = APIRouter()

_ALLOWED_VARIANT_COLUMNS = {
    "position",
    "nucleotidePosition",
    "ref",
    "alt",
    "hgvs",
    "consequence",
    "function_score",
    "pvalues",
    "qvalues",
    "depletion_group",
    "gnomad_ac",
    "gnomad_hom",
    "aou_ac",
    "aou_hom",
    "cadd_score",
}


@router.get("/variants", response_model=list[VariantPublic])
async def get_all_variants(db: Session = Depends(get_db)):
    """Get all variants"""
    variants = db.execute(select(Variant)).scalars().all()
    return [VariantPublic.model_validate(v) for v in variants]


@router.get("/variants/disease-types")
async def get_distinct_disease_types(db: Session = Depends(get_db)):
    """Get all distinct disease types from variant_classifications"""
    rows = db.execute(
        text("""
            SELECT DISTINCT disease FROM variant_classifications
            WHERE disease IS NOT NULL AND disease != ''
            ORDER BY disease
        """)
    ).fetchall()
    return [row._mapping["disease"] for row in rows]


@router.get("/variants/clinical-significances")
async def get_distinct_clinical_significances(db: Session = Depends(get_db)):
    """Get all distinct clinical significances from variant_classifications"""
    rows = db.execute(
        text("""
            SELECT DISTINCT clinical_significance FROM variant_classifications
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
    variant: VariantCreate,
    request: Request,
    db: Session = Depends(get_db),
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


@router.get(
    "/variant-classifications", response_model=list[VariantClassificationPublic]
)
async def get_variant_classifications(db: Session = Depends(get_db)):
    """Get all variant classifications linking variants to literature"""
    classifications = db.execute(select(VariantClassification)).scalars().all()
    return [VariantClassificationPublic.model_validate(c) for c in classifications]


@router.get(
    "/variant-classifications/{variant_id}",
    response_model=list[VariantClassificationPublic],
)
async def get_variant_classifications_for_variant(
    variant_id: str, db: Session = Depends(get_db)
):
    """Get all classifications for a specific variant"""
    classifications = (
        db.execute(
            select(VariantClassification).where(
                VariantClassification.variant_id == variant_id
            )
        )
        .scalars()
        .all()
    )
    return [VariantClassificationPublic.model_validate(c) for c in classifications]


@router.get("/literature-counts", response_model=list[VariantClassificationPublic])
async def get_literature_counts(db: Session = Depends(get_db)):
    """Get all variant classifications (legacy, use /variant-classifications)"""
    classifications = db.execute(select(VariantClassification)).scalars().all()
    return [VariantClassificationPublic.model_validate(c) for c in classifications]


@router.post("/variant-classifications", response_model=VariantClassificationPublic)
async def create_variant_classification(
    classification: VariantClassificationCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a new variant classification (curator only)"""
    user = require_curator(request)

    variant = db.get(Variant, classification.variant_id)
    if not variant:
        raise HTTPException(
            status_code=400,
            detail=f"Variant {classification.variant_id} does not exist",
        )

    literature = db.get(Literature, classification.literature_id)
    if not literature:
        raise HTTPException(
            status_code=400,
            detail=f"Literature {classification.literature_id} does not exist",
        )

    if classification.counts is not None and classification.counts < 0:
        raise HTTPException(
            status_code=400,
            detail="Counts must be greater than or equal to 0",
        )

    if classification.linked_variant_ids:
        linked_ids = [
            v.strip() for v in classification.linked_variant_ids.split(",") if v.strip()
        ]
        for linked_id in linked_ids:
            if not db.get(Variant, linked_id):
                raise HTTPException(
                    status_code=400,
                    detail=f"Linked variant {linked_id} does not exist",
                )

    existing = db.get(
        VariantClassification, (classification.variant_id, classification.literature_id)
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Variant classification for {classification.variant_id} "
                f"and {classification.literature_id} already exists"
            ),
        )

    new_classification = VariantClassification.model_validate(classification)
    db.add(new_classification)
    db.commit()
    db.refresh(new_classification)

    audit_log(
        "variant_classifications",
        f"{classification.variant_id}/{classification.literature_id}",
        "CREATE",
        None,
        classification.model_dump(),
        user["github_login"],
    )

    return VariantClassificationPublic.model_validate(new_classification)


@router.put("/variant-classifications")
async def update_variant_classification(
    request: Request,
    db: Session = Depends(get_db),
    variant_id: str | None = None,
    literature_id: str | None = None,
    clinical_significance: str | None = None,
    zygosity: str | None = None,
    inheritance: str | None = None,
    disease: str | None = None,
    counts: int | None = None,
    linked_variant_ids: str | None = None,
):
    """Update a variant classification (curator only)"""
    user = require_curator(request)

    if not variant_id or not literature_id:
        raise HTTPException(
            status_code=400, detail="variant_id and literature_id are required"
        )

    existing = db.get(VariantClassification, (variant_id, literature_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Variant classification not found")

    old_values = existing.model_dump()

    update_data = {
        "clinical_significance": clinical_significance,
        "zygosity": zygosity,
        "inheritance": inheritance,
        "disease": disease,
        "counts": counts,
        "linked_variant_ids": linked_variant_ids,
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}

    for field, value in update_data.items():
        setattr(existing, field, value)

    db.commit()

    audit_log(
        "variant_classifications",
        f"{variant_id}/{literature_id}",
        "UPDATE",
        old_values,
        update_data,
        user["github_login"],
    )

    updated = db.get(VariantClassification, (variant_id, literature_id))
    return VariantClassificationPublic.model_validate(updated)


@router.delete("/variant-classifications")
async def delete_variant_classification(
    request: Request,
    db: Session = Depends(get_db),
    variant_id: str | None = None,
    literature_id: str | None = None,
):
    """Delete a variant classification (curator only)"""
    user = require_curator(request)

    if not variant_id or not literature_id:
        raise HTTPException(
            status_code=400, detail="variant_id and literature_id are required"
        )

    existing = db.get(VariantClassification, (variant_id, literature_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Variant classification not found")

    old_values = existing.model_dump()

    db.delete(existing)
    db.commit()

    audit_log(
        "variant_classifications",
        f"{variant_id}/{literature_id}",
        "DELETE",
        old_values,
        None,
        user["github_login"],
    )

    return {"message": f"Variant classification {variant_id}/{literature_id} deleted"}


@router.get(
    "/genes/{gene_id}/variant-classifications",
    response_model=list[VariantClassificationPublic],
)
async def get_gene_variant_classifications(gene_id: str, db: Session = Depends(get_db)):
    """Get all variant classifications for a specific gene."""
    classifications = (
        db.execute(
            select(VariantClassification)
            .join(Variant, Variant.id == VariantClassification.variant_id)
            .where(Variant.geneId == gene_id)
        )
        .scalars()
        .all()
    )
    return [VariantClassificationPublic.model_validate(c) for c in classifications]


@router.post("/variant-classifications/bulk")
async def bulk_import_variant_classifications(
    request: Request,
    db: Session = Depends(get_db),
):
    """Bulk import variant classifications (curator only)"""
    require_curator(request)
    body = await request.json()

    if isinstance(body, list):
        classifications = body
    else:
        classifications = body.get("classifications", [])

    if not classifications:
        raise HTTPException(status_code=400, detail="No classifications provided")

    imported_count = 0
    skipped_count = 0
    errors = []

    for idx, classification_data in enumerate(classifications):
        try:
            variant = db.get(Variant, classification_data.get("variant_id"))
            if not variant:
                errors.append(
                    {
                        "row": idx + 1,
                        "field": "variant_id",
                        "message": (
                            f"Variant {classification_data.get('variant_id')} "
                            "does not exist"
                        ),
                    }
                )
                skipped_count += 1
                continue

            literature = db.get(Literature, classification_data.get("literature_id"))
            if not literature:
                errors.append(
                    {
                        "row": idx + 1,
                        "field": "literature_id",
                        "message": (
                            f"Literature {classification_data.get('literature_id')} "
                            "does not exist"
                        ),
                    }
                )
                skipped_count += 1
                continue

            counts = classification_data.get("counts")
            if counts is not None and counts < 0:
                errors.append(
                    {
                        "row": idx + 1,
                        "field": "counts",
                        "message": "Counts must be greater than or equal to 0",
                    }
                )
                skipped_count += 1
                continue

            linked_ids = classification_data.get("linked_variant_ids")
            if linked_ids:
                link_error = False
                for linked_id in [
                    v.strip() for v in linked_ids.split(",") if v.strip()
                ]:
                    if not db.get(Variant, linked_id):
                        errors.append(
                            {
                                "row": idx + 1,
                                "field": "linked_variant_ids",
                                "message": f"Linked variant {linked_id} does not exist",
                            }
                        )
                        skipped_count += 1
                        link_error = True
                        break
                if link_error:
                    continue

            existing = db.get(
                VariantClassification,
                (
                    classification_data.get("variant_id"),
                    classification_data.get("literature_id"),
                ),
            )
            if existing:
                existing.clinical_significance = classification_data.get(
                    "clinical_significance"
                )
                existing.zygosity = classification_data.get("zygosity")
                existing.disease = classification_data.get("disease")
                existing.counts = classification_data.get("counts")
                existing.linked_variant_ids = classification_data.get(
                    "linked_variant_ids"
                )
                existing.inheritance = classification_data.get("inheritance")
                imported_count += 1
                continue

            new_classification = VariantClassification(
                variant_id=classification_data.get("variant_id"),
                literature_id=classification_data.get("literature_id"),
                clinical_significance=classification_data.get("clinical_significance"),
                zygosity=classification_data.get("zygosity"),
                inheritance=classification_data.get("inheritance"),
                disease=classification_data.get("disease"),
                counts=classification_data.get("counts"),
                linked_variant_ids=classification_data.get("linked_variant_ids"),
            )
            db.add(new_classification)
            imported_count += 1

        except Exception as e:
            errors.append(
                {
                    "row": idx + 1,
                    "field": "general",
                    "message": str(e),
                }
            )
            skipped_count += 1

    db.commit()

    return {
        "success": True,
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "errors": errors,
    }
