"""Approval workflow router for curator changes requiring admin review."""

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Request, Query, Depends
from pydantic import BaseModel, Field

from api.routers.auth import require_curator, require_admin
from rnudb_utils.database import get_db_connection

router = APIRouter(prefix="/approvals")

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateChangeRequest(BaseModel):
    entity_type: str = Field(..., pattern="^(gene|variant|literature|structure|bed_track)$")
    entity_id: Optional[str] = None
    gene_id: str
    action: str = Field(..., pattern="^(create|update|delete)$")
    payload: dict[str, Any]


class ReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    notes: Optional[str] = None


class PendingChangeOut(BaseModel):
    id: int
    entity_type: str
    entity_id: Optional[str]
    gene_id: str
    action: str
    payload: dict[str, Any]
    requested_by: str
    requested_at: str
    status: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[str]
    review_notes: Optional[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_dict(row) -> dict:
    import json
    d = dict(row)
    if d.get("payload"):
        d["payload"] = json.loads(d["payload"])
    return d


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=PendingChangeOut)
async def create_pending_change(
    body: CreateChangeRequest,
    user: dict = Depends(require_curator)
):
    """Curator submits a change request for admin approval."""
    import json

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO pending_changes (entity_type, entity_id, gene_id, action, payload, requested_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
        """,
        (
            body.entity_type,
            body.entity_id,
            body.gene_id,
            body.action,
            json.dumps(body.payload),
            user["github_login"],
        ),
    )
    conn.commit()
    row_id = cursor.lastrowid
    cursor.execute("SELECT * FROM pending_changes WHERE id = ?", (row_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


@router.get("", response_model=list[PendingChangeOut])
async def list_pending_changes(
    status: Optional[str] = Query(None, pattern="^(pending|approved|rejected)$"),
    gene_id: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None, pattern="^(gene|variant|literature|structure|bed_track)$"),
    user: dict = Depends(require_curator)
):
    """List pending changes - curators see their own, admins see all."""
    is_admin = user["role"] == "admin"

    conn = get_db_connection()
    cursor = conn.cursor()

    conditions = []
    params: list[Any] = []

    if status:
        conditions.append("status = ?")
        params.append(status)
    if gene_id:
        conditions.append("gene_id = ?")
        params.append(gene_id)
    if entity_type:
        conditions.append("entity_type = ?")
        params.append(entity_type)
    if not is_admin:
        conditions.append("requested_by = ?")
        params.append(user["github_login"])

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    cursor.execute(
        f"""SELECT * FROM pending_changes {where_clause}
           ORDER BY requested_at DESC LIMIT 200""",
        params,
    )
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


@router.post("/{change_id}/review", response_model=PendingChangeOut)
async def review_change(
    change_id: int,
    body: ReviewRequest,
    user: dict = Depends(require_admin)
):
    """Admin approves or rejects a pending change."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT status FROM pending_changes WHERE id = ?", (change_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Change request not found")
    if row["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Change already reviewed")

    cursor.execute(
        """
        UPDATE pending_changes
        SET status = ?, reviewed_by = ?, reviewed_at = ?, review_notes = ?
        WHERE id = ?
        """,
        (
            body.status,
            user["github_login"],
            datetime.now(timezone.utc).isoformat(),
            body.notes,
            change_id,
        ),
    )
    conn.commit()
    cursor.execute("SELECT * FROM pending_changes WHERE id = ?", (change_id,))
    updated = cursor.fetchone()
    conn.close()
    return _row_to_dict(updated)


@router.get("/{change_id}", response_model=PendingChangeOut)
async def get_change(
    change_id: int,
    user: dict = Depends(require_curator)
):
    """Get a single change request by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pending_changes WHERE id = ?", (change_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Change request not found")
    row_dict = _row_to_dict(row)
    if user["role"] != "admin" and row_dict["requested_by"] != user["github_login"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return row_dict
