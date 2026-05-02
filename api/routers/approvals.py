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


@router.post("/{change_id}/apply", response_model=PendingChangeOut)
async def apply_approved_change(
    change_id: int,
    user: dict = Depends(require_admin)
):
    """Apply an approved change to the database."""
    import json

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM pending_changes WHERE id = ?", (change_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Change request not found")

    change = _row_to_dict(row)

    if change["status"] != "approved":
        conn.close()
        raise HTTPException(status_code=400, detail="Only approved changes can be applied")

    entity_type = change["entity_type"]
    action = change["action"]
    payload = change["payload"]
    entity_id = change["entity_id"]
    gene_id = change["gene_id"]

    try:
        if entity_type == "variant":
            if action == "create":
                cursor.execute("""
                    INSERT INTO variants (id, geneId, position, ref, alt, consequence, clinical_significance,
                        gnomad_ac, gnomad_hom, aou_ac, aou_hom, function_score, pmid)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    payload.get("id"),
                    gene_id,
                    payload.get("position"),
                    payload.get("ref"),
                    payload.get("alt"),
                    payload.get("consequence"),
                    payload.get("clinical_significance"),
                    payload.get("gnomad_ac"),
                    payload.get("gnomad_hom"),
                    payload.get("aou_ac"),
                    payload.get("aou_hom"),
                    payload.get("function_score"),
                    payload.get("pmid"),
                ))
            elif action == "update":
                set_clauses = []
                params = []
                for key, value in payload.items():
                    if key not in ("id", "geneId"):
                        set_clauses.append(f"{key} = ?")
                        params.append(value)
                if set_clauses:
                    params.append(entity_id)
                    cursor.execute(f"UPDATE variants SET {', '.join(set_clauses)} WHERE id = ?", params)
            elif action == "delete":
                cursor.execute("DELETE FROM variants WHERE id = ?", (entity_id,))

        elif entity_type == "gene":
            if action == "create":
                cursor.execute("""
                    INSERT INTO genes (id, name, fullName, chromosome, start, end, strand, sequence, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    payload.get("id"),
                    payload.get("name"),
                    payload.get("fullName"),
                    payload.get("chromosome"),
                    payload.get("start"),
                    payload.get("end"),
                    payload.get("strand"),
                    payload.get("sequence"),
                    payload.get("description"),
                ))
            elif action == "update":
                set_clauses = []
                params = []
                for key, value in payload.items():
                    if key != "id":
                        set_clauses.append(f"{key} = ?")
                        params.append(value)
                if set_clauses:
                    params.append(entity_id)
                    cursor.execute(f"UPDATE genes SET {', '.join(set_clauses)} WHERE id = ?", params)
            elif action == "delete":
                cursor.execute("DELETE FROM genes WHERE id = ?", (entity_id,))

        elif entity_type == "literature":
            if action == "create":
                cursor.execute("""
                    INSERT INTO literature (id, title, authors, journal, year, doi)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    payload.get("id"),
                    payload.get("title"),
                    payload.get("authors"),
                    payload.get("journal"),
                    payload.get("year"),
                    payload.get("doi"),
                ))
            elif action == "update":
                set_clauses = []
                params = []
                for key, value in payload.items():
                    if key != "id":
                        set_clauses.append(f"{key} = ?")
                        params.append(value)
                if set_clauses:
                    params.append(entity_id)
                    cursor.execute(f"UPDATE literature SET {', '.join(set_clauses)} WHERE id = ?", params)
            elif action == "delete":
                cursor.execute("DELETE FROM literature WHERE id = ?", (entity_id,))

        elif entity_type == "structure":
            if action == "delete":
                cursor.execute("DELETE FROM rna_structures WHERE id = ?", (entity_id,))

        elif entity_type == "bed_track":
            if action == "delete":
                cursor.execute("DELETE FROM bed_tracks WHERE id = ?", (entity_id,))

        conn.commit()

        cursor.execute("SELECT * FROM pending_changes WHERE id = ?", (change_id,))
        updated = cursor.fetchone()
        conn.close()
        return _row_to_dict(updated)

    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
