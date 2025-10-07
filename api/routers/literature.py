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

        # Get literature with associated genes
        cursor.execute("""
            SELECT l.*, GROUP_CONCAT(lg.gene_id) as gene_ids
            FROM literature l
            LEFT JOIN literature_genes lg ON l.pmid = lg.pmid
            GROUP BY l.pmid
        """)
        rows = cursor.fetchall()

        literature = []
        for row in rows:
            row_dict = dict(row)
            gene_ids = row_dict.pop("gene_ids", "")
            associated_genes = gene_ids.split(",") if gene_ids else []
            row_dict["associatedGenes"] = associated_genes
            literature.append(Literature(**row_dict))

        conn.close()
        return literature
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
