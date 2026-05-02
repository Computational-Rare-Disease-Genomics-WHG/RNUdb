from fastapi import APIRouter, HTTPException, Request
from typing import List

from api.models import BEDTrack
from api.routers.auth import require_admin
from rnudb_utils.database import get_db_connection, audit_log

router = APIRouter(tags=["bed-tracks"])


@router.get("/genes/{gene_id}/bed-tracks", response_model=List[BEDTrack])
async def get_gene_bed_tracks(gene_id: str):
    """Get all BED tracks for a specific gene."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """
        SELECT * FROM bed_tracks
        WHERE geneId = ?
        ORDER BY interval_start
        """,
        (gene_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [
        BEDTrack(
            id=row["id"],
            geneId=row["geneId"],
            track_name=row["track_name"],
            chrom=row["chrom"],
            interval_start=row["interval_start"],
            interval_end=row["interval_end"],
            label=row["label"],
            score=row["score"],
            color=row["color"],
            created_at=row["created_at"],
            created_by=row["created_by"]
        )
        for row in rows
    ]


@router.get("/bed-tracks", response_model=List[BEDTrack])
async def get_all_bed_tracks():
    """Get all BED tracks across all genes."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM bed_tracks ORDER BY geneId, interval_start")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        BEDTrack(
            id=row["id"],
            geneId=row["geneId"],
            track_name=row["track_name"],
            chrom=row["chrom"],
            interval_start=row["interval_start"],
            interval_end=row["interval_end"],
            label=row["label"],
            score=row["score"],
            color=row["color"],
            created_at=row["created_at"],
            created_by=row["created_by"]
        )
        for row in rows
    ]


@router.delete("/bed-tracks/{track_id}")
async def delete_bed_track(track_id: int, request: Request):
    """Delete a BED track by ID (admin only)."""
    user = require_admin(request)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM bed_tracks WHERE id = ?", (track_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"BED track {track_id} not found")
    
    old_values = dict(row)
    cursor.execute("DELETE FROM bed_tracks WHERE id = ?", (track_id,))
    conn.commit()
    
    audit_log("bed_tracks", track_id, "DELETE", old_values, None, user["github_login"])
    
    conn.close()
    
    return {"success": True, "message": f"BED track {track_id} deleted"}
