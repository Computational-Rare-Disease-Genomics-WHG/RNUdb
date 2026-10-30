"""Variant equivalence API endpoints (public reads).

Equivalent-variant relationships (Specific Recommendation 8 / PM5) are
written exclusively through the approval workflow (pending_changes), never
directly, to avoid the write bypass pattern flagged in issues #299-#303.
This router exposes public read endpoints used by the gene page (InfoPanel,
overlay, variant card) and the Curate page.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from api.models import (
    VariantEquivalence,
    VariantEquivalencePublic,
)
from rnudb_utils.database import get_db

router = APIRouter()


def _flatten_variant(db: Session, variant_id: str) -> dict | None:
    """Return a minimal variant dict for display, with primary classification."""
    row = db.execute(
        text(
            """
            SELECT v.id, v.geneId, v.hgvs, v.nucleotidePosition, v.ref, v.alt,
                   v.position
            FROM variants v
            WHERE v.id = :vid
            """
        ),
        {"vid": variant_id},
    ).fetchone()
    if not row:
        return None

    d = dict(row._mapping)
    class_row = db.execute(
        text(
            """
            SELECT clinical_significance, disease
            FROM variant_classifications
            WHERE variant_id = :vid
              AND clinical_significance IS NOT NULL
            ORDER BY rowid
            LIMIT 1
            """
        ),
        {"vid": variant_id},
    ).fetchone()
    d["clinical_significance"] = (
        class_row["clinical_significance"] if class_row else None
    )
    d["disease_type"] = class_row["disease"] if class_row else None
    return d


def _public(equivalence: VariantEquivalence, db: Session) -> VariantEquivalencePublic:
    """Build the public response with both flattened variants."""
    return VariantEquivalencePublic(
        variant_id=equivalence.variant_id,
        equivalent_variant_id=equivalence.equivalent_variant_id,
        relationship_type=equivalence.relationship_type,
        mechanism_match=equivalence.mechanism_match,
        functional_region=equivalence.functional_region,
        evidence_direction=equivalence.evidence_direction,
        status=equivalence.status,
        notes=equivalence.notes,
        literature_id=equivalence.literature_id,
        variant=_flatten_variant(db, equivalence.variant_id),
        equivalent_variant=_flatten_variant(db, equivalence.equivalent_variant_id),
    )


@router.get("/equivalences", response_model=list[VariantEquivalencePublic])
async def get_all_equivalences(db: Session = Depends(get_db)):
    """Get all variant equivalences (public)."""
    equivalences = db.execute(select(VariantEquivalence)).scalars().all()
    return [_public(eq, db) for eq in equivalences]


@router.get(
    "/genes/{gene_id}/equivalences",
    response_model=list[VariantEquivalencePublic],
)
async def get_gene_equivalences(gene_id: str, db: Session = Depends(get_db)):
    """Get all equivalences touching any variant of a gene (either side)."""
    rows = db.execute(
        text(
            """
            SELECT DISTINCT ve.variant_id, ve.equivalent_variant_id,
                            ve.relationship_type, ve.mechanism_match,
                            ve.functional_region, ve.evidence_direction,
                            ve.status, ve.notes, ve.literature_id
            FROM variant_equivalences ve
            JOIN variants va ON va.id = ve.variant_id
            JOIN variants vb ON vb.id = ve.equivalent_variant_id
            WHERE va.geneId = :gene_id OR vb.geneId = :gene_id
            ORDER BY ve.variant_id
            """
        ),
        {"gene_id": gene_id},
    ).fetchall()

    result = []
    for row in rows:
        result.append(
            VariantEquivalencePublic(
                **dict(row._mapping),
                variant=_flatten_variant(db, row._mapping["variant_id"]),
                equivalent_variant=_flatten_variant(
                    db, row._mapping["equivalent_variant_id"]
                ),
            )
        )
    return result


@router.get("/equivalences/{variant_id}", response_model=list[VariantEquivalencePublic])
async def get_variant_equivalences(variant_id: str, db: Session = Depends(get_db)):
    """Get all equivalences for a specific variant (public)."""
    equivalences = (
        db.execute(
            select(VariantEquivalence).where(
                (VariantEquivalence.variant_id == variant_id)
                | (VariantEquivalence.equivalent_variant_id == variant_id)
            )
        )
        .scalars()
        .all()
    )
    if not equivalences:
        raise HTTPException(status_code=404, detail="No equivalences for variant")
    return [_public(eq, db) for eq in equivalences]
