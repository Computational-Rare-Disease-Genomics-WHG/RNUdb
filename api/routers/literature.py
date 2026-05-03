"""Literature API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models import (
    Literature,
    LiteratureCount,
    LiteratureCreate,
    LiteraturePublic,
    LiteratureUpdate,
)
from api.routers.auth import require_admin
from rnudb_utils.database import audit_log, get_db

router = APIRouter()

_ALLOWED_LITERATURE_COLUMNS = {"title", "authors", "journal", "year", "doi"}


@router.get("/literature", response_model=list[LiteraturePublic])
async def get_all_literature(db: Session = Depends(get_db)):
    """Get all literature"""
    literature = db.execute(select(Literature)).scalars().all()
    return [LiteraturePublic.model_validate(lit) for lit in literature]


@router.get("/literature/{literature_id}", response_model=LiteraturePublic)
async def get_literature(literature_id: str, db: Session = Depends(get_db)):
    """Get a specific literature entry"""
    lit = db.get(Literature, literature_id)
    if not lit:
        raise HTTPException(status_code=404, detail="Literature not found")
    return LiteraturePublic.model_validate(lit)


@router.post("/literature", response_model=LiteraturePublic)
async def create_literature(
    lit: LiteratureCreate, request: Request, db: Session = Depends(get_db)
):
    """Create new literature (curator only)"""
    user = require_admin(request)

    if db.get(Literature, lit.id):
        raise HTTPException(
            status_code=409, detail=f"Literature {lit.id} already exists"
        )

    new_lit = Literature.model_validate(lit)
    db.add(new_lit)
    db.commit()
    db.refresh(new_lit)

    audit_log(
        "literature", lit.id, "CREATE", None, lit.model_dump(), user["github_login"]
    )

    return LiteraturePublic.model_validate(new_lit)


@router.put("/literature/{literature_id}", response_model=LiteraturePublic)
async def update_literature(
    literature_id: str,
    lit: LiteratureUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Update literature (curator only)"""
    user = require_admin(request)

    existing = db.get(Literature, literature_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Literature not found")

    old_values = existing.model_dump()

    for field, value in lit.model_dump(exclude_unset=True).items():
        if field in _ALLOWED_LITERATURE_COLUMNS:
            setattr(existing, field, value)

    db.commit()

    audit_log(
        "literature",
        literature_id,
        "UPDATE",
        old_values,
        lit.model_dump(exclude_unset=True),
        user["github_login"],
    )

    updated = db.get(Literature, literature_id)
    return LiteraturePublic.model_validate(updated)


@router.delete("/literature/{literature_id}")
async def delete_literature(
    literature_id: str, request: Request, db: Session = Depends(get_db)
):
    """Delete literature (curator only)"""
    user = require_admin(request)

    existing = db.get(Literature, literature_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Literature not found")

    old_values = existing.model_dump()

    db.delete(existing)
    db.commit()

    audit_log(
        "literature", literature_id, "DELETE", old_values, None, user["github_login"]
    )

    return {"message": f"Literature {literature_id} deleted"}


@router.get("/literature-counts", response_model=list[LiteratureCount])
async def get_literature_counts(db: Session = Depends(get_db)):
    """Get all literature counts"""
    counts = db.execute(select(LiteratureCount)).scalars().all()
    return [LiteratureCount.model_validate(c) for c in counts]
