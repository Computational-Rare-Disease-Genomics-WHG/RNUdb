from fastapi import APIRouter, HTTPException
from typing import List
from rnudb_utils.database import get_db_connection
from ..models import Variant, LiteratureCounts

router = APIRouter()


@router.get("/literature-counts", response_model=List[LiteratureCounts])
async def get_literature_counts():
    """Get all literature counts linking variants to literature"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all literature counts
        cursor.execute("""
            SELECT * FROM literature_counts
        """)
        rows = cursor.fetchall()

        literature_counts = []
        for row in rows:
            literature_counts.append(LiteratureCounts(**dict(row)))

        conn.close()
        return literature_counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
