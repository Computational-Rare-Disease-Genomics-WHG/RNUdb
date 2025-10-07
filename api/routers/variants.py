from fastapi import APIRouter, HTTPException
from typing import List
from rnudb_utils.database import get_db_connection
from ..models import Variant

router = APIRouter()

@router.get("/variants/{variant_id}", response_model=Variant)
async def get_variant(variant_id: str):
    """Get specific variant by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM variants WHERE id = ?", (variant_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Variant not found")

        variant = Variant(**dict(row))
        conn.close()
        return variant
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
