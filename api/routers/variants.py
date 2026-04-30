from fastapi import APIRouter, HTTPException, Request
from typing import List
from rnudb_utils.database import get_db_connection, audit_log
from api.routers.auth import require_curator
from ..models import Variant, LiteratureCounts, VariantCreate, VariantUpdate

router = APIRouter()


@router.get("/variants", response_model=List[Variant])
async def get_all_variants():
    """Get all variants"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM variants")
        rows = cursor.fetchall()
        variants = [Variant(**dict(row)) for row in rows]
        conn.close()
        return variants
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/variants/{variant_id}", response_model=Variant)
async def get_variant(variant_id: str):
    """Get a specific variant"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM variants WHERE id = ?", (variant_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Variant not found")
        return Variant(**dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/variants", response_model=Variant)
async def create_variant(variant: VariantCreate, request: Request):
    """Create a new variant (curator only)"""
    user = require_curator(request)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM variants WHERE id = ?", (variant.id,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail=f"Variant {variant.id} already exists")
        cursor.execute(
            """
            INSERT INTO variants (id, geneId, position, nucleotidePosition, ref, alt, hgvs, consequence,
                clinvar_significance, clinical_significance, pmid, function_score, pvalues, qvalues,
                depletion_group, gnomad_ac, gnomad_hom, aou_ac, aou_hom, ukbb_ac, ukbb_hom,
                cadd_score, zygosity, cohort)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (variant.id, variant.geneId, variant.position, variant.nucleotidePosition, variant.ref, variant.alt,
             variant.hgvs, variant.consequence, variant.clinvar_significance, variant.clinical_significance,
             variant.pmid, variant.function_score, variant.pvalues, variant.qvalues, variant.depletion_group,
             variant.gnomad_ac, variant.gnomad_hom, variant.aou_ac, variant.aou_hom, variant.ukbb_ac,
             variant.ukbb_hom, variant.cadd_score, variant.zygosity, variant.cohort),
        )
        conn.commit()
        audit_log("variants", variant.id, "CREATE", None, variant.dict(), user["github_login"])
        conn.close()
        return Variant(**variant.dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/variants/{variant_id}", response_model=Variant)
async def update_variant(variant_id: str, variant: VariantUpdate, request: Request):
    """Update a variant (curator only)"""
    user = require_curator(request)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM variants WHERE id = ?", (variant_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Variant not found")
        old_values = dict(existing)
        updates = []
        params = []
        for field, value in variant.dict(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            params.append(value)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(variant_id)
        cursor.execute(f"UPDATE variants SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        audit_log("variants", variant_id, "UPDATE", old_values, variant.dict(exclude_unset=True), user["github_login"])
        cursor.execute("SELECT * FROM variants WHERE id = ?", (variant_id,))
        updated = cursor.fetchone()
        conn.close()
        return Variant(**dict(updated))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/variants/{variant_id}")
async def delete_variant(variant_id: str, request: Request):
    """Delete a variant (curator only)"""
    user = require_curator(request)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM variants WHERE id = ?", (variant_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Variant not found")
        old_values = dict(existing)
        cursor.execute("DELETE FROM variants WHERE id = ?", (variant_id,))
        conn.commit()
        audit_log("variants", variant_id, "DELETE", old_values, None, user["github_login"])
        conn.close()
        return {"message": f"Variant {variant_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/literature-counts", response_model=List[LiteratureCounts])
async def get_literature_counts():
    """Get all literature counts linking variants to literature"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM literature_counts")
        rows = cursor.fetchall()
        literature_counts = [LiteratureCounts(**dict(row)) for row in rows]
        conn.close()
        return literature_counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
