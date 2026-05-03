"""Approval workflow router for curator changes requiring admin review."""

import json
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from sqlmodel import SQLModel

from api.models import PendingChange, PendingChangeOut
from api.routers.auth import require_admin, require_curator
from rnudb_utils.database import get_db

router = APIRouter(prefix="/approvals")

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CreateChangeRequest(SQLModel):
    entity_type: Literal["variant", "gene", "literature", "structure", "bed_track"]
    entity_id: str | None = None
    gene_id: str
    action: Literal["create", "update", "delete"]
    payload: dict[str, Any]


class ReviewRequest(SQLModel):
    status: Literal["approved", "rejected"]
    notes: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


# Allowed columns for each entity type (whitelist to prevent SQL injection)
_ALLOWED_COLUMNS = {
    "variant": {
        "position",
        "nucleotidePosition",
        "ref",
        "alt",
        "hgvs",
        "consequence",
        "clinical_significance",
        "gnomad_ac",
        "gnomad_hom",
        "aou_ac",
        "aou_hom",
        "function_score",
        "pmid",
        "pvalues",
        "qvalues",
        "depletion_group",
        "ukbb_ac",
        "ukbb_hom",
        "cadd_score",
        "zygosity",
        "cohort",
    },
    "gene": {
        "name",
        "fullName",
        "chromosome",
        "start",
        "end",
        "strand",
        "sequence",
        "description",
    },
    "literature": {"title", "authors", "journal", "year", "doi"},
}

_ENTITY_TABLE_MAP = {
    "variant": "variants",
    "gene": "genes",
    "literature": "literature",
    "structure": "rna_structures",
    "bed_track": "bed_tracks",
}


def _row_to_dict(row) -> dict:
    import json

    if hasattr(row, "__table__"):
        d = {key: getattr(row, key) for key in row.__table__.columns.keys()}
    else:
        d = dict(row._mapping)
    if d.get("payload") and isinstance(d["payload"], str):
        d["payload"] = json.loads(d["payload"])
    return d


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("", response_model=PendingChangeOut)
async def create_pending_change(
    body: CreateChangeRequest,
    user: dict = Depends(require_curator),
    db: Session = Depends(get_db),
):
    """Curator submits a change request for admin approval."""

    new_change = PendingChange(
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        gene_id=body.gene_id,
        action=body.action,
        payload=body.payload,
        requested_by=user["github_login"],
        status="pending",
    )
    db.add(new_change)
    db.commit()
    db.refresh(new_change)

    return _row_to_dict(new_change)


@router.get("", response_model=list[PendingChangeOut])
async def list_pending_changes(
    status: str | None = Query(None, pattern="^(pending|approved|rejected)$"),
    gene_id: str | None = Query(None),
    entity_type: str | None = Query(
        None, pattern="^(gene|variant|literature|structure|bed_track)$"
    ),
    user: dict = Depends(require_curator),
    db: Session = Depends(get_db),
):
    """List pending changes - curators see their own, admins see all."""
    is_admin = user["role"] == "admin"

    query = select(PendingChange)

    if status:
        query = query.where(PendingChange.status == status)
    if gene_id:
        query = query.where(PendingChange.gene_id == gene_id)
    if entity_type:
        query = query.where(PendingChange.entity_type == entity_type)
    if not is_admin:
        query = query.where(PendingChange.requested_by == user["github_login"])

    query = query.order_by(PendingChange.requested_at.desc()).limit(200)

    rows = db.execute(query).scalars().all()
    return [row.model_dump(mode="json") for row in rows]


@router.post("/{change_id}/review", response_model=PendingChangeOut)
async def review_change(
    change_id: int,
    body: ReviewRequest,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin approves/rejects pending change."""
    change = db.get(PendingChange, change_id)
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")
    if change.status != "pending":
        # Idempotent: return current state without error
        return _row_to_dict(change)

    change.status = body.status
    change.reviewed_by = user["github_login"]
    change.reviewed_at = datetime.now(UTC)
    change.review_notes = body.notes
    db.commit()
    db.refresh(change)

    return _row_to_dict(change)


@router.get("/{change_id}", response_model=PendingChangeOut)
async def get_change(
    change_id: int,
    user: dict = Depends(require_curator),
    db: Session = Depends(get_db),
):
    """Get a single change request by ID."""
    change = db.get(PendingChange, change_id)
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    row_dict = _row_to_dict(change)
    if user["role"] != "admin" and row_dict["requested_by"] != user["github_login"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return row_dict


@router.post("/{change_id}/apply", response_model=PendingChangeOut)
async def apply_approved_change(
    change_id: int,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Apply an approved change."""
    change = db.get(PendingChange, change_id)
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")

    if change.status not in ("approved", "applied"):
        raise HTTPException(
            status_code=400, detail="Only approved changes can be applied"
        )

    # Idempotent: if already applied, return current state
    if change.applied_at is not None:
        return _row_to_dict(change)

    entity_type = change.entity_type
    action = change.action
    payload = (
        change.payload
        if isinstance(change.payload, dict)
        else json.loads(change.payload)
    )
    entity_id = change.entity_id

    try:
        if entity_type == "variant":
            if action == "create":
                # Build dynamic INSERT based on payload fields
                # Validate column names against whitelist to prevent SQL injection
                allowed_cols = {
                    "id", "geneId", "position", "nucleotidePosition", "ref", "alt",
                    "hgvs", "consequence", "clinical_significance", "pmid",
                    "function_score", "pvalues", "qvalues", "depletion_group",
                    "gnomad_ac", "gnomad_hom", "aou_ac", "aou_hom",
                    "ukbb_ac", "ukbb_hom", "cadd_score", "zygosity", "cohort",
                }
                cols = [c for c in payload.keys() if c in allowed_cols]
                placeholders = [f":{c}" for c in cols]
                # Column names are validated against whitelist above, safe to use
                db.execute(
                    text(f"""  # noqa: S608
                        INSERT INTO variants ({", ".join(cols)})
                        VALUES ({", ".join(placeholders)})
                    """),
                    payload,
                )
            elif action == "update":
                # Build safe update query
                allowed = _ALLOWED_COLUMNS.get("variant", set())
                set_clauses = []
                params = {}
                for key, value in payload.items():
                    if key not in ("id", "geneId") and (not allowed or key in allowed):
                        set_clauses.append(f"{key} = :{key}")
                        params[key] = value
                if set_clauses:
                    params["entity_id"] = entity_id
                    db.execute(
                        text(f"""
                            UPDATE variants
                            SET {", ".join(set_clauses)}
                            WHERE id = :entity_id
                        """),  # noqa: S608
                        params,
                    )
            elif action == "delete":
                db.execute(
                    text("DELETE FROM variants WHERE id = :entity_id"),
                    {"entity_id": entity_id},
                )

        elif entity_type == "gene":
            if action == "create":
                db.execute(
                    text("""
                        INSERT INTO genes
                            (id, name, fullName, chromosome, start, end,
                             strand, sequence, description)
                        VALUES
                            (:id, :name, :fullName, :chromosome, :start, :end,
                             :strand, :sequence, :description)
                    """),
                    payload,
                )
            elif action == "update":
                allowed = _ALLOWED_COLUMNS.get("gene", set())
                set_clauses = []
                params = {}
                for key, value in payload.items():
                    if key != "id" and (not allowed or key in allowed):
                        set_clauses.append(f"{key} = :{key}")
                        params[key] = value
                if set_clauses:
                    params["entity_id"] = entity_id
                    db.execute(
                        text(f"""
                            UPDATE genes
                            SET {", ".join(set_clauses)}
                            WHERE id = :entity_id
                        """),  # noqa: S608
                        params,
                    )
            elif action == "delete":
                db.execute(
                    text("DELETE FROM genes WHERE id = :entity_id"),
                    {"entity_id": entity_id},
                )

        elif entity_type == "literature":
            if action == "create":
                db.execute(
                    text("""
                        INSERT INTO literature
                            (id, title, authors, journal, year, doi)
                        VALUES (:id, :title, :authors, :journal, :year, :doi)
                    """),
                    payload,
                )
            elif action == "update":
                allowed = _ALLOWED_COLUMNS.get("literature", set())
                set_clauses = []
                params = {}
                for key, value in payload.items():
                    if key != "id" and (not allowed or key in allowed):
                        set_clauses.append(f"{key} = :{key}")
                        params[key] = value
                if set_clauses:
                    params["entity_id"] = entity_id
                    db.execute(
                        text(f"""
                            UPDATE literature
                            SET {", ".join(set_clauses)}
                            WHERE id = :entity_id
                        """),  # noqa: S608
                        params,
                    )
            elif action == "delete":
                db.execute(
                    text("DELETE FROM literature WHERE id = :entity_id"),
                    {"entity_id": entity_id},
                )

        elif entity_type == "structure":
            if action == "delete":
                db.execute(
                    text("DELETE FROM rna_structures WHERE id = :entity_id"),
                    {"entity_id": entity_id},
                )

        elif entity_type == "bed_track":
            if action == "delete":
                db.execute(
                    text("DELETE FROM bed_tracks WHERE id = :entity_id"),
                    {"entity_id": entity_id},
                )

        db.commit()

        # Mark as applied to prevent double-apply
        change.applied_at = datetime.now(UTC)
        change.status = "applied"
        db.commit()
        db.refresh(change)
        return _row_to_dict(change)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from None
