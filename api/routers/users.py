from fastapi import APIRouter, Depends, Request

from api.notifications import notify_user_approved
from api.routers.auth import require_admin
from rnudb_utils.database import (
    list_all_users,
    list_pending_users,
    update_user_role,
)

router = APIRouter()


@router.get("", response_model=list)
async def get_all_users(request: Request):
    """List all users (admin only)."""
    require_admin(request)
    rows = list_all_users(limit=1000)
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
async def get_pending_users(request: Request):
    """List pending users (admin only)."""
    require_admin(request)
    rows = list_pending_users()
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


@router.post("/users/{github_login}/approve")
async def approve_user(
    github_login: str,
    user: dict = Depends(require_admin),
):
    """Approve a pending user as curator (admin only)."""
    update_user_role(github_login, "curator")
    notify_user_approved(github_login, user.get("github_login", "admin"))
    return {"message": f"User {github_login} approved as curator"}


@router.post("/users/{github_login}/reject")
async def reject_user(github_login: str, request: Request):
    """Reject or remove a user (admin only)."""
    require_admin(request)
    update_user_role(github_login, "guest")
    return {"message": f"User {github_login} role set to guest"}
