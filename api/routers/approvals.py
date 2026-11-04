"""Approval workflow router for curator changes requiring admin review."""

import json
import logging
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from sqlmodel import SQLModel

from api.models import PendingChange, PendingChangeOut
from api.notifications import notify_change_approved, notify_change_rejected
from api.routers.auth import require_admin, require_curator
from rnudb_utils.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/approvals")

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CreateChangeRequest(SQLModel):
    entity_type: Literal[
        "variant", "gene", "literature", "structure", "bed_track", "equivalence"
    ]
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
        "gnomad_ac",
        "gnomad_hom",
        "aou_ac",
        "aou_hom",
        "function_score",
        "pvalues",
        "qvalues",
        "depletion_group",
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
    "equivalence": {
        "relationship_type",
        "status",
        "notes",
        "literature_id",
    },
}

_ENTITY_TABLE_MAP = {
    "variant": "variants",
    "gene": "genes",
    "literature": "literature",
    "structure": "rna_structures",
    "bed_track": "bed_tracks",
    "equivalence": "variant_equivalences",
}


def _normalize_equivalence_pair(v1: str, v2: str) -> tuple[str, str]:
    """Return the ordered pair (variant_id < equivalent_variant_id)."""
    return (v1, v2) if v1 < v2 else (v2, v1)


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
        None, pattern="^(gene|variant|literature|structure|bed_track|equivalence)$"
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


def _apply_approved(change_id: int, db: Session) -> dict:
    """Apply one approved change (shared by single + batch endpoints).

    Raises HTTPException on failure after rolling back the session, so batch
    callers can continue applying the remaining changes.
    """
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

    # Validate equivalence payloads before touching the DB so bad requests
    # surface as 400 (the try/except below would otherwise turn them into 500s).
    if entity_type == "equivalence" and action != "delete":
        if not payload.get("variant_id") or not payload.get("equivalent_variant_id"):
            raise HTTPException(
                status_code=400,
                detail="Equivalence requires variant_id and equivalent_variant_id",
            )
        v1 = str(payload["variant_id"])
        v2 = str(payload["equivalent_variant_id"])
        if v1 == v2:
            raise HTTPException(
                status_code=400, detail="A variant cannot be equivalent to itself"
            )
        genes = {}
        for vid in (v1, v2):
            row = db.execute(
                text("SELECT geneId FROM variants WHERE id = :vid"), {"vid": vid}
            ).fetchone()
            if not row:
                raise HTTPException(
                    status_code=400, detail=f"Variant {vid} does not exist"
                )
            genes[vid] = row._mapping["geneId"]
        if genes[v1] == genes[v2]:
            raise HTTPException(
                status_code=400,
                detail="Equivalent variants must belong to different genes",
            )
        if action == "create":
            ov1, ov2 = _normalize_equivalence_pair(v1, v2)
            dup = db.execute(
                text(
                    """
                    SELECT 1 FROM variant_equivalences
                    WHERE variant_id = :v1 AND equivalent_variant_id = :v2
                    """
                ),
                {"v1": ov1, "v2": ov2},
            ).fetchone()
            if dup:
                raise HTTPException(
                    status_code=400,
                    detail=f"Equivalence {ov1}|{ov2} already exists",
                )

    if entity_type == "equivalence" and action in ("update", "delete"):
        if payload.get("variant_id") and payload.get("equivalent_variant_id"):
            ev1, ev2 = _normalize_equivalence_pair(
                str(payload["variant_id"]), str(payload["equivalent_variant_id"])
            )
        elif entity_id and "|" in entity_id:
            ev1, ev2 = _normalize_equivalence_pair(*entity_id.split("|", 1))
        else:
            raise HTTPException(
                status_code=400, detail="Equivalence pair not specified"
            )
        existing = db.execute(
            text(
                """
                SELECT 1 FROM variant_equivalences
                WHERE variant_id = :v1 AND equivalent_variant_id = :v2
                """
            ),
            {"v1": ev1, "v2": ev2},
        ).fetchone()
        if not existing:
            raise HTTPException(
                status_code=400,
                detail=f"Equivalence {ev1}|{ev2} does not exist",
            )

    try:
        if entity_type == "variant":
            if action == "create":
                # Build dynamic INSERT based on payload fields
                # Validate column names against whitelist to prevent SQL injection
                allowed_cols = {
                    "id",
                    "geneId",
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

                fetch_pop = payload.get("fetch_population_data", False)
                if fetch_pop:
                    from rnudb_utils import (
                        query_all_of_us_variants,
                        query_gnomad_variants,
                    )

                    chrom = payload.get("chromosome", "")
                    if chrom.startswith("chr"):
                        chrom = chrom[3:]

                    start = payload.get("start")
                    end = payload.get("end")
                    gene_id = payload["id"]

                    gnomad_variants = (
                        query_gnomad_variants(chrom, start, end)
                        if (query_gnomad_variants and start and end)
                        else []
                    )
                    aou_variants = (
                        query_all_of_us_variants(chrom, start, end)
                        if (query_all_of_us_variants and start and end)
                        else []
                    )

                    variants_to_insert = []

                    for v in gnomad_variants:
                        variants_to_insert.append(
                            {
                                "id": f"chr{chrom}-{v['position']}-{v['ref']}"
                                f"-{v['alt']}",
                                "geneId": gene_id,
                                "position": v["position"],
                                "ref": v["ref"],
                                "alt": v["alt"],
                                "gnomad_ac": v.get("gnomad_ac"),
                                "gnomad_hom": v.get("gnomad_hom"),
                                "aou_ac": None,
                                "aou_hom": None,
                            }
                        )

                    for v in aou_variants:
                        if not v.get("position"):
                            continue
                        vid = f"chr{chrom}-{v['position']}-{v.get('ref', '')}"
                        vid = f"{vid}-{v.get('alt', '')}"
                        existing = next(
                            (x for x in variants_to_insert if x["id"] == vid), None
                        )
                        if existing:
                            existing["aou_ac"] = v.get("aou_ac")
                            existing["aou_hom"] = v.get("aou_hom")
                        else:
                            variants_to_insert.append(
                                {
                                    "id": vid,
                                    "geneId": gene_id,
                                    "position": v["position"],
                                    "ref": v.get("ref", ""),
                                    "alt": v.get("alt", ""),
                                    "gnomad_ac": None,
                                    "gnomad_hom": None,
                                    "aou_ac": v.get("aou_ac"),
                                    "aou_hom": v.get("aou_hom"),
                                }
                            )

                    for v in variants_to_insert:
                        db.execute(
                            text("""
                                INSERT INTO variants
                                (id, geneId, position, ref, alt, gnomad_ac,
                                 gnomad_hom, aou_ac, aou_hom)
                                VALUES
                                (:id, :geneId, :position, :ref, :alt, :gnomad_ac,
                                 :gnomad_hom, :aou_ac, :aou_hom)
                                ON CONFLICT(id) DO UPDATE SET
                                    gnomad_ac = EXCLUDED.gnomad_ac,
                                    gnomad_hom = EXCLUDED.gnomad_hom,
                                    aou_ac = EXCLUDED.aou_ac,
                                    aou_hom = EXCLUDED.aou_hom
                            """),
                            v,
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
                    text(
                        """
                        DELETE FROM variant_equivalences
                        WHERE variant_id IN (
                            SELECT id FROM variants WHERE geneId = :entity_id
                        )
                        OR equivalent_variant_id IN (
                            SELECT id FROM variants WHERE geneId = :entity_id
                        )
                        """
                    ),
                    {"entity_id": entity_id},
                )
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

        elif entity_type == "equivalence":
            if action == "create":
                v1 = str(payload["variant_id"])
                v2 = str(payload["equivalent_variant_id"])
                v1, v2 = _normalize_equivalence_pair(v1, v2)
                dup = db.execute(
                    text(
                        """
                        SELECT 1 FROM variant_equivalences
                        WHERE variant_id = :v1 AND equivalent_variant_id = :v2
                        """
                    ),
                    {"v1": v1, "v2": v2},
                ).fetchone()
                if dup:
                    raise ValueError(f"Equivalence {v1}|{v2} already exists")
                allowed = _ALLOWED_COLUMNS.get("equivalence", set())
                cols = ["variant_id", "equivalent_variant_id"]
                params: dict[str, Any] = {
                    "variant_id": v1,
                    "equivalent_variant_id": v2,
                }
                for key, value in payload.items():
                    if key in allowed and value is not None:
                        cols.append(key)
                        params[key] = value
                placeholders = [f":{c}" for c in cols]
                db.execute(
                    text(
                        f"""
                        INSERT INTO variant_equivalences ({", ".join(cols)})
                        VALUES ({", ".join(placeholders)})
                        """
                    ),  # noqa: S608
                    params,
                )
            elif action == "update":
                allowed = _ALLOWED_COLUMNS.get("equivalence", set())
                if payload.get("variant_id") and payload.get("equivalent_variant_id"):
                    v1, v2 = _normalize_equivalence_pair(
                        str(payload["variant_id"]),
                        str(payload["equivalent_variant_id"]),
                    )
                elif entity_id and "|" in entity_id:
                    v1, v2 = _normalize_equivalence_pair(*entity_id.split("|", 1))
                else:
                    raise ValueError("Equivalence pair not specified for update")
                set_clauses = []
                params: dict[str, Any] = {"v1": v1, "v2": v2}
                for key, value in payload.items():
                    if key in allowed and value is not None:
                        set_clauses.append(f"{key} = :{key}")
                        params[key] = value
                if set_clauses:
                    db.execute(
                        text(
                            f"""
                            UPDATE variant_equivalences
                            SET {", ".join(set_clauses)}
                            WHERE variant_id = :v1 AND equivalent_variant_id = :v2
                            """
                        ),  # noqa: S608
                        params,
                    )
            elif action == "delete":
                if payload.get("variant_id") and payload.get("equivalent_variant_id"):
                    v1, v2 = _normalize_equivalence_pair(
                        str(payload["variant_id"]),
                        str(payload["equivalent_variant_id"]),
                    )
                elif entity_id and "|" in entity_id:
                    v1, v2 = _normalize_equivalence_pair(*entity_id.split("|", 1))
                else:
                    raise ValueError("Equivalence pair not specified for delete")
                db.execute(
                    text(
                        """
                        DELETE FROM variant_equivalences
                        WHERE variant_id = :v1 AND equivalent_variant_id = :v2
                        """
                    ),
                    {"v1": v1, "v2": v2},
                )

        db.commit()

        # Mark as applied to prevent double-apply
        change.applied_at = datetime.now(UTC)
        change.status = "applied"
        db.commit()
        db.refresh(change)
        return _row_to_dict(change)

    except Exception:
        db.rollback()
        logger.exception("Failed to apply approved change %s", change_id)
        raise HTTPException(status_code=500, detail="Internal server error") from None


@router.post("/{change_id}/apply", response_model=PendingChangeOut)
async def apply_approved_change(
    change_id: int,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Apply an approved change."""
    return _apply_approved(change_id, db)


class ApplyBatchRequest(SQLModel):
    """Request body for POST /approvals/apply-batch."""

    ids: list[int] | None = None
    all_approved: bool = False


@router.post("/apply-batch")
async def apply_batch_changes(
    body: ApplyBatchRequest,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Apply multiple approved changes, one transaction per change.

    Provide `ids` to apply specific changes, or `all_approved: true` to apply
    every currently-approved change. A failure in one change does not abort
    the rest; per-row results are returned.
    """
    if body.all_approved:
        ids = (
            db.execute(
                select(PendingChange.id).where(PendingChange.status == "approved")
            )
            .scalars()
            .all()
        )
    else:
        ids = body.ids or []

    results: list[dict] = []
    for cid in ids:
        try:
            outcome = _apply_approved(int(cid), db)
            results.append(
                {"id": int(cid), "ok": True, "status": outcome.get("status")}
            )
        except HTTPException as exc:
            results.append({"id": int(cid), "ok": False, "error": str(exc.detail)})
        except (
            Exception
        ) as exc:  # defensive — _apply_approved already maps to HTTPException
            db.rollback()
            results.append({"id": int(cid), "ok": False, "error": str(exc)})

    return {
        "applied": sum(1 for r in results if r["ok"]),
        "failed": sum(1 for r in results if not r["ok"]),
        "results": results,
    }
