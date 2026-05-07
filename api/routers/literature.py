"""Literature API endpoints."""

import re as regex_lib

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models import (
    Literature,
    LiteratureCreate,
    LiteraturePublic,
    LiteratureUpdate,
    VariantClassification,
    VariantClassificationPublic,
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


@router.put("/literature")
async def update_literature_by_id(
    request: Request,
    literature_id: str,
    lit: LiteratureUpdate,
    db: Session = Depends(get_db),
):
    """Update literature by ID (supports DOIs with slashes)"""
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


@router.delete("/literature")
async def delete_literature_by_id(
    request: Request,
    literature_id: str,
    db: Session = Depends(get_db),
):
    """Delete literature by ID (supports DOIs with slashes)"""
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


@router.get("/literature-counts", response_model=list[VariantClassificationPublic])
async def get_literature_counts(db: Session = Depends(get_db)):
    """Get all variant classifications (legacy endpoint)"""
    counts = db.execute(select(VariantClassification)).scalars().all()
    return [VariantClassificationPublic.model_validate(c) for c in counts]


@router.post("/literature/bulk")
async def bulk_import_literature(
    request: Request,
    literature: list[dict],
    db: Session = Depends(get_db),
):
    """Bulk import literature entries (admin only)"""
    user = require_admin(request)

    imported_count = 0
    skipped_count = 0
    errors: list[dict] = []

    for idx, lit_data in enumerate(literature):
        try:
            doi = lit_data.get("doi", "").strip()
            title = lit_data.get("title", "").strip()
            authors = lit_data.get("authors", "").strip()
            journal = lit_data.get("journal", "").strip()
            year = lit_data.get("year", "").strip()

            row_errors: list[dict] = []
            if not doi:
                row_errors.append({"field": "doi", "message": "DOI is required"})
            if not title:
                row_errors.append({"field": "title", "message": "Title is required"})
            if not authors:
                row_errors.append(
                    {"field": "authors", "message": "Authors is required"}
                )
            if not journal:
                row_errors.append(
                    {"field": "journal", "message": "Journal is required"}
                )
            if not year:
                row_errors.append({"field": "year", "message": "Year is required"})
            elif not regex_lib.match(r"^\d{4}$", year):
                row_errors.append(
                    {"field": "year", "message": "Year must be a 4-digit number"}
                )

            if row_errors:
                for err in row_errors:
                    errors.append(
                        {
                            "row": idx + 2,
                            "field": err["field"],
                            "message": err["message"],
                        }
                    )
                skipped_count += 1
                continue

            existing = db.get(Literature, doi)
            if existing:
                skipped_count += 1
                continue

            new_lit = Literature(
                id=doi,
                title=title or "Unknown",
                authors=authors or "Unknown",
                journal=journal or "Unknown",
                year=year or "Unknown",
                doi=doi,
                pmid=lit_data.get("pmid", "").strip() or None,
                url=lit_data.get("url", "").strip() or None,
            )
            db.add(new_lit)
            imported_count += 1

        except Exception as e:
            errors.append({"row": idx + 2, "field": "unknown", "message": str(e)})
            skipped_count += 1

    db.commit()

    audit_log(
        "literature",
        "bulk_import",
        "CREATE",
        None,
        {"imported": imported_count, "skipped": skipped_count},
        user["github_login"],
    )

    return {
        "success": True,
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "errors": errors,
    }
