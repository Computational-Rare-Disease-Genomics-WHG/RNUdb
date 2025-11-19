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

        # Get variant with linked variant IDs
        cursor.execute("""
            SELECT v.*,
                   GROUP_CONCAT(DISTINCT vl1.variant_id_2) as linked_ids_1,
                   GROUP_CONCAT(DISTINCT vl2.variant_id_1) as linked_ids_2
            FROM variants v
            LEFT JOIN variant_links vl1 ON v.id = vl1.variant_id_1
            LEFT JOIN variant_links vl2 ON v.id = vl2.variant_id_2
            WHERE v.id = ?
            GROUP BY v.id
        """, (variant_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Variant not found")

        row_dict = dict(row)

        # Combine linked variant IDs from both directions
        linked_ids = []
        if row_dict.get('linked_ids_1'):
            linked_ids.extend(row_dict['linked_ids_1'].split(','))
        if row_dict.get('linked_ids_2'):
            linked_ids.extend(row_dict['linked_ids_2'].split(','))

        # Remove the aggregated columns and add linkedVariantIds
        row_dict.pop('linked_ids_1', None)
        row_dict.pop('linked_ids_2', None)
        if linked_ids:
            row_dict['linkedVariantIds'] = linked_ids

        variant = Variant(**row_dict)
        conn.close()
        return variant
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
