from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.models import User
from api.notifications import notify_user_approved
from api.routers.auth import require_admin
from rnudb_utils.database import (
    audit_log,
    get_db,
    list_all_users,
    list_pending_users,
)

router = APIRouter()


@router.get("", response_model=list)
async def get_all_users(
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users (admin only)."""
    rows = list_all_users(limit=1000, session=db)
    return [
        {
            "github_login": r["github_login"],
            "name": r["name"],
            "email": r["email"],
            "avatar_url": r.get("avatar_url"),
            "role": r["role"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


@router.get("/pending", response_model=list)
async def get_pending_users(
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List pending users (admin only)."""
    rows = list_pending_users(session=db)
    return [
        {
            "github_login": r["github_login"],
            "name": r["name"],
            "email": r["email"],
            "avatar_url": r.get("avatar_url"),
            "role": r["role"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


def _get_target_user(db: Session, github_login: str) -> User:
    user = db.get(User, github_login)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {github_login} not found")
    return user


@router.post("/{github_login}/approve")
async def approve_user(
    github_login: str,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Approve a pending user as curator (admin only)."""
    target = _get_target_user(db, github_login)

    if target.role in ("curator", "admin"):
        raise HTTPException(
            status_code=409,
            detail=f"User {github_login} already has role '{target.role}'",
        )

    old_values = target.model_dump(mode="json")
    target.role = "curator"
    db.commit()
    db.refresh(target)

    audit_log(
        "users",
        github_login,
        "UPDATE",
        old_values,
        {"role": "curator"},
        user["github_login"],
        db,
    )

    notify_user_approved(github_login, user.get("github_login", "admin"))
    return {"message": f"User {github_login} approved as curator"}


@router.post("/{github_login}/reject")
async def reject_user(
    github_login: str,
    user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reject or remove a user (admin only)."""
    target = _get_target_user(db, github_login)

    if target.role == "guest":
        raise HTTPException(
            status_code=409,
            detail=f"User {github_login} is already a guest",
        )
    if target.role == "admin":
        raise HTTPException(
            status_code=409,
            detail=f"User {github_login} is an admin and cannot be rejected",
        )

    old_values = target.model_dump(mode="json")
    target.role = "guest"
    db.commit()
    db.refresh(target)

    audit_log(
        "users",
        github_login,
        "UPDATE",
        old_values,
        {"role": "guest"},
        user["github_login"],
        db,
    )

    return {"message": f"User {github_login} role set to guest"}
