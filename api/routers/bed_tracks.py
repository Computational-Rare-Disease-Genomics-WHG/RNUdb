"""BED track API endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List

from api.models import BEDTrack
from rnudb_utils.database import get_db_connection

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
async def delete_bed_track(track_id: int):
    """Delete a BED track by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM bed_tracks WHERE id = ?", (track_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"BED track {track_id} not found")
    
    cursor.execute("DELETE FROM bed_tracks WHERE id = ?", (track_id,))
    conn.commit()
    conn.close()
    
    return {"success": True, "message": f"BED track {track_id} deleted"}
