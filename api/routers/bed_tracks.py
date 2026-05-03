"""BED track API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models import BedTrack, BedTrackPublic
from api.routers.auth import require_admin
from rnudb_utils.database import audit_log, get_db

router = APIRouter(tags=["bed-tracks"])


@router.get("/genes/{gene_id}/bed-tracks", response_model=list[BedTrackPublic])
async def get_gene_bed_tracks(gene_id: str, db: Session = Depends(get_db)):
    """Get all BED tracks for a specific gene."""
    tracks = (
        db.execute(
            select(BedTrack)
            .where(BedTrack.geneId == gene_id)
            .order_by(BedTrack.interval_start)
        )
        .scalars()
        .all()
    )

    return [track.model_dump(mode="json") for track in tracks]


@router.get("/bed-tracks", response_model=list[BedTrackPublic])
async def get_all_bed_tracks(db: Session = Depends(get_db)):
    """Get all BED tracks across all genes."""
    tracks = (
        db.execute(select(BedTrack).order_by(BedTrack.geneId, BedTrack.interval_start))
        .scalars()
        .all()
    )

    return [track.model_dump(mode="json") for track in tracks]


@router.delete("/bed-tracks/{track_id}")
async def delete_bed_track(
    track_id: int, request: Request, db: Session = Depends(get_db)
):
    """Delete a BED track by ID (admin only)."""
    user = require_admin(request)

    existing = db.get(BedTrack, track_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"BED track {track_id} not found")

    old_values = existing.model_dump()

    db.delete(existing)
    db.commit()

    audit_log("bed_tracks", track_id, "DELETE", old_values, None, user["github_login"])

    return {"success": True, "message": f"BED track {track_id} deleted"}
