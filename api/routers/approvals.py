"""Approval workflow router for curator changes requiring admin review."""

import json
import logging
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlmodel import SQLModel

from api.models import AuditLog, PendingChange, PendingChangeOut
from api.notifications import (
    notify_change_approved,
    notify_change_rejected,
    notify_change_submitted,
)
from api.routers.auth import require_admin, require_curator
from api.services.import_ops import (
    exec_bed_track_import,
    exec_literature_bulk_import,
    exec_structure_import,
    exec_variant_batch,
)
from rnudb_utils.database import (
    delete_gene_cascade,
    delete_literature_cascade,
    delete_structure_cascade,
    delete_variant_cascade,
    get_db,
    insert_variants,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/approvals")

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CreateChangeRequest(SQLModel):
    entity_type: Literal["variant", "gene", "literature", "structure", "bed_track"]
    entity_id: str | None = None
    gene_id: str
    action: Literal["create", "update", "delete", "import"]
    payload: dict[str, Any]


class ReviewRequest(SQLModel):
    status: Literal["approved", "rejected"]
    notes: str | None = None


# ---------------------------------------------------------------------------
# Column whitelists (single source of truth — #318)
# ---------------------------------------------------------------------------

#: DB columns each entity type may be written to.
_ALLOWED_COLUMNS = {
    "variant": {
        "position",
        "nucleotidePosition",
        "ref",
        "alt",
        "hgvs",
        "consequence",
        "function_score",
        "pvalues",
        "qvalues",
        "depletion_group",
        "gnomad_ac",
        "gnomad_hom",
        "aou_ac",
        "aou_hom",
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
    "literature": {"title", "authors", "journal", "year", "doi", "pmid", "url"},
    "structure": set(),  # only delete supported directly
    "bed_track": set(),  # only delete supported directly
}

#: Meta keys accepted on top of DB columns (mostly for create actions).
_META_KEYS = {
    "variant": {"id", "geneId"},
    "gene": {"id"},
    "literature": {"id"},
    "structure": {"id"},
    "bed_track": {"id"},
}

#: Top-level keys accepted for the ``import`` action payloads.
_IMPORT_SHAPE_KEYS = {
    "variant": {"geneId", "variants", "skip_invalid"},
    "structure": {"geneId", "structure", "set_primary"},
    "bed_track": {"geneId", "track_name", "intervals", "color"},
    "literature": {"geneId", "literature"},
}

_ENTITY_TABLE_MAP = {
    "variant": "variants",
    "gene": "genes",
    "literature": "literature",
    "structure": "rna_structures",
    "bed_track": "bed_tracks",
}


#: Supported (entity, action) combinations. Anything else is rejected at
#: submission so an approved change can never apply as a silent no-op.
_SUPPORTED_ACTIONS = {
    "variant": {"create", "update", "delete", "import"},
    "gene": {"create", "update", "delete"},
    "literature": {"create", "update", "delete", "import"},
    "structure": {"delete", "import"},
    "bed_track": {"delete", "import"},
}


def _validate_action_supported(entity_type: str, action: str) -> None:
    supported = _SUPPORTED_ACTIONS.get(entity_type, set())
    if action not in supported:
        raise HTTPException(
            status_code=422,
            detail={
                "message": (
                    f"Action '{action}' is not supported for entity "
                    f"type '{entity_type}'"
                ),
                "allowed_actions": sorted(supported),
            },
        )


def _payload_allowed_keys(entity_type: str, action: str) -> set[str]:
    """Allowed top-level payload keys for an entity/action pair."""
    allowed = set(_ALLOWED_COLUMNS.get(entity_type, set()))
    allowed |= _META_KEYS.get(entity_type, set())
    if entity_type == "gene" and action == "create":
        allowed.add("fetch_population_data")
    if action == "import":
        allowed |= _IMPORT_SHAPE_KEYS.get(entity_type, set())
    return allowed


def _validate_payload_keys(entity_type: str, action: str, payload: dict) -> None:
    """Reject payloads with non-whitelisted keys instead of silently dropping them."""
    allowed = _payload_allowed_keys(entity_type, action)
    invalid = sorted(k for k in payload.keys() if k not in allowed)
    if invalid:
        raise HTTPException(
            status_code=422,
            detail={
                "message": (
                    f"Invalid payload fields for {entity_type} {action}: "
                    f"{', '.join(invalid)}"
                ),
                "invalid_fields": invalid,
                "allowed_fields": sorted(allowed),
            },
        )


def _row_to_dict(row) -> dict:
    if hasattr(row, "__table__"):
        d = {key: getattr(row, key) for key in row.__table__.columns.keys()}
    else:
        d = dict(row._mapping)
    if d.get("payload") and isinstance(d["payload"], str):
        d["payload"] = json.loads(d["payload"])
    return d


def _fetch_row(db: Session, table: str, entity_id: Any) -> dict | None:
    """Fetch a single row by primary key (table name comes from the whitelist)."""
    if entity_id is None:
        return None
    row = db.execute(
        text(f"SELECT * FROM {table} WHERE id = :eid"), {"eid": entity_id}
    ).fetchone()
    return dict(row._mapping) if row else None


def _audit_entry(
    db: Session,
    table: str,
    record_id: str | None,
    action: str,
    old_values: Any,
    new_values: Any,
    actor: str,
) -> None:
    """Queue an audit-log entry on the current session.

    Unlike rnudb_utils.database.audit_log this does NOT commit, so the entry is
    persisted atomically with the apply mutation it describes (#310).
    """
    db.add(
        AuditLog(
            table_name=table,
            record_id=record_id,
            action=action,
            old_values=old_values,
            new_values=new_values,
            user_login=actor,
        )
    )


def _entity_exists(db: Session, entity_type: str, entity_id: str) -> bool:
    """Check whether an entity row exists (for delete/create collision checks)."""
    table = _ENTITY_TABLE_MAP.get(entity_type)
    if not table:
        return False
    row = db.execute(
        text(f"SELECT 1 FROM {table} WHERE id = :eid"), {"eid": entity_id}
    ).fetchone()
    return row is not None


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

    # Reject unsupported entity/action combinations so an approved change can
    # never be applied as a silent no-op.
    _validate_action_supported(body.entity_type, body.action)

    # Reject unknown payload keys at submission time (#312)
    _validate_payload_keys(body.entity_type, body.action, body.payload)

    payload = dict(body.payload)

    # For gene creation with population data, fetch gnomAD/All of Us NOW (outside
    # any DB transaction) so apply is a deterministic DB operation (#317).
    if (
        body.entity_type == "gene"
        and body.action == "create"
        and payload.get("fetch_population_data")
    ):
        try:
            from rnudb_utils.external_apis import merge_population_variants

            payload["population_variants"] = merge_population_variants(
                payload.get("id", body.gene_id),
                payload.get("chromosome", ""),
                payload.get("start"),
                payload.get("end"),
            )
        except Exception:
            logger.exception(
                "Failed to fetch population variants for gene %s at submission",
                payload.get("id", body.gene_id),
            )
            payload["population_variants"] = []

    new_change = PendingChange(
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        gene_id=body.gene_id,
        action=body.action,
        payload=payload,
        requested_by=user["github_login"],
        status="pending",
    )
    db.add(new_change)
    db.commit()
    db.refresh(new_change)

    # Notify admins that a new change needs review (#320, fail silently)
    notify_change_submitted(
        body.entity_type,
        body.action,
        user["github_login"],
    )

    return _row_to_dict(new_change)


@router.get("", response_model=list[PendingChangeOut])
async def list_pending_changes(
    status: str | None = Query(
        None, pattern="^(pending|approved|rejected|applied|failed)$"
    ),
    gene_id: str | None = Query(None),
    entity_type: str | None = Query(
        None, pattern="^(gene|variant|literature|structure|bed_track)$"
    ),
    user: dict = Depends(require_curator),
    db: Session = Depends(get_db),
):
    """List pending changes - curators see their own, admins see all."""
    is_admin = user["role"] == "admin"

    from sqlalchemy import select

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

    # Send Slack notification (fail silently)
    if body.status == "approved":
        notify_change_approved(
            change.entity_type,
            change.action,
            change.requested_by,
            user["github_login"],
        )
    elif body.status == "rejected":
        notify_change_rejected(
            change.entity_type,
            change.action,
            change.requested_by,
            user["github_login"],
            body.notes,
        )

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

    if change.status not in ("approved", "failed", "applied"):
        raise HTTPException(
            status_code=400, detail="Only approved or failed changes can be applied"
        )

    # Idempotent: if already applied, return current state
    if change.applied_at is not None:
        return _row_to_dict(change)

    # Retrying a failed apply: clear the previous failure marker
    if change.status == "failed":
        change.status = "approved"
        change.failure_reason = None

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
                # Build dynamic INSERT based on payload fields. Column names are
                # validated against the whitelist at submission time (#312) and
                # filtered again here to prevent SQL injection.
                allowed = _payload_allowed_keys("variant", "create")
                cols = [c for c in payload.keys() if c in allowed]
                placeholders = [f":{c}" for c in cols]
                db.execute(  # noqa: S608 - cols validated against whitelist above
                    text(f"""
                        INSERT INTO variants ({", ".join(cols)})
                        VALUES ({", ".join(placeholders)})
                    """),
                    {c: payload[c] for c in cols},
                )
                _audit_entry(
                    db,
                    "variants",
                    str(payload.get("id")),
                    "CREATE",
                    None,
                    {c: payload[c] for c in cols},
                    user["github_login"],
                )
            elif action == "update":
                allowed = _ALLOWED_COLUMNS["variant"]
                changed = {k: v for k, v in payload.items() if k in allowed}
                if changed:
                    old_row = _fetch_row(db, "variants", entity_id)
                    set_clauses = [f"{k} = :{k}" for k in changed]
                    params = {**changed, "entity_id": entity_id}
                    db.execute(
                        text(f"""
                            UPDATE variants
                            SET {", ".join(set_clauses)}
                            WHERE id = :entity_id
                        """),  # noqa: S608
                        params,
                    )
                    _audit_entry(
                        db,
                        "variants",
                        str(entity_id),
                        "UPDATE",
                        old_row,
                        changed,
                        user["github_login"],
                    )
            elif action == "delete":
                if not _entity_exists(db, "variant", entity_id or ""):
                    raise HTTPException(
                        status_code=404, detail=f"Variant {entity_id} not found"
                    )
                old_row = _fetch_row(db, "variants", entity_id)
                delete_variant_cascade(db, entity_id)
                _audit_entry(
                    db,
                    "variants",
                    str(entity_id),
                    "DELETE",
                    old_row,
                    None,
                    user["github_login"],
                )
            elif action == "import":
                gene_id = payload.get("geneId") or change.gene_id
                rows = payload.get("variants")
                skip_invalid = bool(payload.get("skip_invalid", True))
                if rows is None:
                    # Flat single-variant payload shape
                    rows = [payload]
                exec_variant_batch(db, gene_id, rows, skip_invalid, change.requested_by)

        elif entity_type == "gene":
            if action == "create":
                gene_payload = {
                    "id": payload.get("id"),
                    "name": payload.get("name"),
                    "fullName": payload.get("fullName"),
                    "chromosome": payload.get("chromosome"),
                    "start": payload.get("start"),
                    "end": payload.get("end"),
                    "strand": payload.get("strand"),
                    "sequence": payload.get("sequence"),
                    "description": payload.get("description"),
                }
                db.execute(
                    text("""
                        INSERT INTO genes
                            (id, name, fullName, chromosome, start, end,
                             strand, sequence, description)
                        VALUES
                            (:id, :name, :fullName, :chromosome, :start, :end,
                             :strand, :sequence, :description)
                    """),
                    gene_payload,
                )
                _audit_entry(
                    db,
                    "genes",
                    str(gene_payload.get("id")),
                    "CREATE",
                    None,
                    gene_payload,
                    user["github_login"],
                )

                # Population data was fetched at submission time, so apply is a
                # deterministic DB operation with no external API calls (#317).
                population_variants = payload.get("population_variants", [])
                if population_variants:
                    insert_variants(population_variants, db)
                    _audit_entry(
                        db,
                        "variants",
                        "population_import",
                        "CREATE",
                        None,
                        {
                            "geneId": gene_payload.get("id"),
                            "count": len(population_variants),
                        },
                        user["github_login"],
                    )
            elif action == "update":
                allowed = _ALLOWED_COLUMNS["gene"]
                changed = {k: v for k, v in payload.items() if k in allowed}
                if changed:
                    old_row = _fetch_row(db, "genes", entity_id)
                    set_clauses = [f"{k} = :{k}" for k in changed]
                    params = {**changed, "entity_id": entity_id}
                    db.execute(
                        text(f"""
                            UPDATE genes
                            SET {", ".join(set_clauses)}
                            WHERE id = :entity_id
                        """),  # noqa: S608
                        params,
                    )
                    _audit_entry(
                        db,
                        "genes",
                        str(entity_id),
                        "UPDATE",
                        old_row,
                        changed,
                        user["github_login"],
                    )
            elif action == "delete":
                if not _entity_exists(db, "gene", entity_id or ""):
                    raise HTTPException(
                        status_code=404, detail=f"Gene {entity_id} not found"
                    )
                old_row = _fetch_row(db, "genes", entity_id)
                delete_gene_cascade(db, entity_id)
                _audit_entry(
                    db,
                    "genes",
                    str(entity_id),
                    "DELETE",
                    old_row,
                    None,
                    user["github_login"],
                )

        elif entity_type == "literature":
            if action == "create":
                db.execute(
                    text("""
                        INSERT INTO literature
                            (id, title, authors, journal, year, doi, pmid, url)
                        VALUES (:id, :title, :authors, :journal, :year, :doi,
                                :pmid, :url)
                    """),
                    {
                        "id": payload.get("id"),
                        "title": payload.get("title"),
                        "authors": payload.get("authors"),
                        "journal": payload.get("journal"),
                        "year": payload.get("year"),
                        "doi": payload.get("doi"),
                        "pmid": payload.get("pmid"),
                        "url": payload.get("url"),
                    },
                )
                _audit_entry(
                    db,
                    "literature",
                    str(payload.get("id")),
                    "CREATE",
                    None,
                    payload,
                    user["github_login"],
                )
            elif action == "update":
                allowed = _ALLOWED_COLUMNS["literature"]
                changed = {k: v for k, v in payload.items() if k in allowed}
                if changed:
                    old_row = _fetch_row(db, "literature", entity_id)
                    set_clauses = [f"{k} = :{k}" for k in changed]
                    params = {**changed, "entity_id": entity_id}
                    db.execute(
                        text(f"""
                            UPDATE literature
                            SET {", ".join(set_clauses)}
                            WHERE id = :entity_id
                        """),  # noqa: S608
                        params,
                    )
                    _audit_entry(
                        db,
                        "literature",
                        str(entity_id),
                        "UPDATE",
                        old_row,
                        changed,
                        user["github_login"],
                    )
            elif action == "delete":
                if not _entity_exists(db, "literature", entity_id or ""):
                    raise HTTPException(
                        status_code=404, detail=f"Literature {entity_id} not found"
                    )
                old_row = _fetch_row(db, "literature", entity_id)
                delete_literature_cascade(db, entity_id)
                _audit_entry(
                    db,
                    "literature",
                    str(entity_id),
                    "DELETE",
                    old_row,
                    None,
                    user["github_login"],
                )
            elif action == "import":
                entries = payload.get("literature") or [payload]
                created_by = change.requested_by
                exec_literature_bulk_import(db, entries, created_by)
                _audit_entry(
                    db,
                    "literature",
                    "bulk_import",
                    "CREATE",
                    None,
                    {"count": len(entries), "created_by": created_by},
                    user["github_login"],
                )

        elif entity_type == "structure":
            if action == "delete":
                if not _entity_exists(db, "structure", entity_id or ""):
                    raise HTTPException(
                        status_code=404,
                        detail=f"Structure {entity_id} not found",
                    )
                old_row = _fetch_row(db, "rna_structures", entity_id)
                delete_structure_cascade(db, entity_id)
                _audit_entry(
                    db,
                    "rna_structures",
                    str(entity_id),
                    "DELETE",
                    old_row,
                    None,
                    user["github_login"],
                )
            elif action == "import":
                gene_id = payload.get("geneId") or change.gene_id
                structure = payload.get("structure")
                if not structure:
                    raise HTTPException(
                        status_code=400,
                        detail="Structure import payload missing 'structure' field",
                    )
                exec_structure_import(db, gene_id, structure, change.requested_by)

        elif entity_type == "bed_track":
            if action == "delete":
                old_row = _fetch_row(db, "bed_tracks", entity_id)
                db.execute(
                    text("DELETE FROM bed_tracks WHERE id = :entity_id"),
                    {"entity_id": entity_id},
                )
                _audit_entry(
                    db,
                    "bed_tracks",
                    str(entity_id),
                    "DELETE",
                    old_row,
                    None,
                    user["github_login"],
                )
            elif action == "import":
                gene_id = payload.get("geneId") or change.gene_id
                track_name = payload.get("track_name")
                intervals = payload.get("intervals")
                if not track_name or intervals is None:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Bed track import payload missing "
                            "'track_name' or 'intervals' field"
                        ),
                    )
                exec_bed_track_import(
                    db,
                    gene_id,
                    track_name,
                    intervals,
                    payload.get("color"),
                    change.requested_by,
                )

        db.commit()

        # Mark as applied to prevent double-apply
        change.applied_at = datetime.now(UTC)
        change.status = "applied"
        db.commit()
        db.refresh(change)
        return _row_to_dict(change)

    except HTTPException:
        db.rollback()
        _mark_apply_failed(db, change_id, exc_info=None)
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to apply approved change %s", change_id)
        _mark_apply_failed(db, change_id, exc_info=str(exc))
        raise HTTPException(status_code=500, detail="Internal server error") from None


def _mark_apply_failed(db: Session, change_id: int, exc_info: str | None) -> None:
    """Persist a failed-apply state so the change is visible and retryable (#309).

    Uses a direct UPDATE because the ORM object may be expired/detached after the
    rollback of the failed apply.
    """
    try:
        detail = f"Apply failed: {exc_info}" if exc_info else "Apply failed"
        db.execute(
            text(
                "UPDATE pending_changes"
                " SET status = 'failed', failure_reason = :reason WHERE id = :id"
            ),
            {"reason": detail[:1000], "id": change_id},
        )
        db.commit()
    except Exception:
        # Never mask the original error if the marker write fails
        db.rollback()
        logger.exception("Failed to record failed-apply state for change %s", change_id)
