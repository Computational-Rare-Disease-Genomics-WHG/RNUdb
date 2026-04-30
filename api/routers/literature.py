from fastapi import APIRouter, HTTPException
from typing import List
from rnudb_utils.database import get_db_connection
from ..models import Literature

router = APIRouter()


@router.get("/literature", response_model=List[Literature])
async def get_all_literature():
    """Get all literature"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all literature
        cursor.execute("""
            SELECT * FROM literature
        """)
        rows = cursor.fetchall()

        literature = []
        for row in rows:
            literature.append(Literature(**dict(row)))

        conn.close()
        return literature
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
