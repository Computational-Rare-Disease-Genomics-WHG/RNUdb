"""Variant equivalence API endpoints (public reads).

Defines equivalent positions between pairs of snRNA genes, manually curated
base-for-base (the same reference base must appear at each matched position).
Writes are exclusively through the approval workflow.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from api.models import (
    EquivalentPosition,
    EquivalentPositionPublic,
)
from api.services.equivalents import find_counterpart_variant
from rnudb_utils.database import get_db

router = APIRouter()


def _as_public(row, db: Session) -> dict:
    """Return a dict with both gene_variant / counterpart gene_variant details."""
    out = dict(row._mapping)
    for label, g, p in (
        ("variant_a", out["gene_a"], out["pos_a"]),
        ("variant_b", out["gene_b"], out["pos_b"]),
    ):
        r = db.execute(
            text(
                "SELECT id, hgvs FROM variants "
                "WHERE geneId=:g AND nucleotidePosition=:p"
            ),
            {"g": g, "p": p},
        ).fetchone()
        out[label] = dict(r._mapping) if r else None
    return out


@router.get("/equivalent-positions", response_model=list[EquivalentPositionPublic])
async def get_all_equivalent_positions(db: Session = Depends(get_db)):
    """Get all position equivalences."""
    return db.execute(select(EquivalentPosition)).scalars().all()


@router.get(
    "/genes/{gene_id}/equivalent-positions",
    response_model=list[EquivalentPositionPublic],
)
async def get_gene_equivalent_positions(gene_id: str, db: Session = Depends(get_db)):
    """Get position equivalences for a gene (as either side)."""
    rows = db.execute(
        text(
            "SELECT * FROM equivalent_positions "
            "WHERE gene_a=:g OR gene_b=:g ORDER BY gene_a, pos_a"
        ),
        {"g": gene_id},
    ).fetchall()
    return [dict(r._mapping) for r in rows]


@router.get("/genes/{gene_id}/variant-equivalents")
async def get_gene_variant_equivalents(gene_id: str, db: Session = Depends(get_db)):
    """Return every variant of the gene with its derived counterpart (or null).

    The counterpart is the variant with the same base change at the mapped
    transcript position in the other gene (if that position is mapped AND such
    a variant exists there). Missing counterparts are null.
    """
    variants = db.execute(
        text(
            "SELECT v.id, v.hgvs, v.nucleotidePosition, v.ref, v.alt, v.geneId, "
            "v.is_synthetic "
            "FROM variants v WHERE v.geneId=:g "
        ),
        {"g": gene_id},
    ).fetchall()
    pairs = db.execute(
        text("SELECT * FROM equivalent_positions WHERE gene_a=:g OR gene_b=:g"),
        {"g": gene_id},
    ).fetchall()

    # Build position->(other_gene, other_pos) map
    pos_map: dict[int, tuple[str, int]] = {}
    for r in pairs:
        rm = dict(r._mapping)
        if rm["gene_a"] == gene_id:
            pos_map[rm["pos_a"]] = (rm["gene_b"], rm["pos_b"])
        else:
            pos_map[rm["pos_b"]] = (rm["gene_a"], rm["pos_a"])

    result = []
    for v in variants:
        vm = dict(v._mapping)
        nuc = vm.get("nucleotidePosition")
        counterpart = None
        if nuc and nuc in pos_map:
            other_g, other_p = pos_map[nuc]
            counterpart = find_counterpart_variant(db, vm, other_g, other_p)
        result.append({"variant": vm, "counterpart": counterpart})
    return result


@router.get("/variants/{variant_id}/equivalent")
async def get_variant_equivalent(variant_id: str, db: Session = Depends(get_db)):
    """Get the derived equivalent of a single variant (or null)."""
    variant = db.execute(
        text(
            "SELECT id, geneId, nucleotidePosition, ref, alt, is_synthetic "
            "FROM variants WHERE id=:vid"
        ),
        {"vid": variant_id},
    ).fetchone()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    vm = dict(variant._mapping)
    nuc = vm.get("nucleotidePosition")
    if not nuc:
        return {"variant": vm, "counterpart": None}
    pair = db.execute(
        text(
            "SELECT * FROM equivalent_positions "
            "WHERE (gene_a=:g AND pos_a=:p) OR (gene_b=:g AND pos_b=:p)"
        ),
        {"g": vm["geneId"], "p": nuc},
    ).fetchone()
    if not pair:
        return {"variant": vm, "counterpart": None}
    pm = dict(pair._mapping)
    other_g = pm["gene_b"] if pm["gene_a"] == vm["geneId"] else pm["gene_a"]
    other_p = pm["pos_b"] if pm["gene_a"] == vm["geneId"] else pm["pos_a"]
    return {
        "variant": vm,
        "counterpart": find_counterpart_variant(db, vm, other_g, other_p),
    }
