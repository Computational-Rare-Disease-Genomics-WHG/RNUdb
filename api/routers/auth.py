import os
import secrets
from datetime import UTC, datetime, timedelta

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from api.models import UserResponse
from rnudb_utils.database import create_user, get_user, list_all_users

router = APIRouter()

# Config from environment
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rnudb.rarediseasegenomics.org")
ADMIN_GITHUB_LOGINS = [
    u.strip().lower()
    for u in os.environ.get("ADMIN_GITHUB_LOGINS", "").split(",")
    if u.strip()
]

JWT_ALGORITHM = "HS256"
JWT_COOKIE_NAME = "session"
JWT_EXPIRE_DAYS = 7


def _github_access_token(code: str) -> dict:
    """Exchange OAuth code for access token with GitHub."""
    resp = httpx.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        },
        headers={"Accept": "application/json"},
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()


def _github_user_info(token: str) -> dict:
    """Fetch user info from GitHub API."""
    resp = httpx.get(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()


def _github_user_emails(token: str) -> list:
    """Fetch user emails from GitHub API."""
    resp = httpx.get(
        "https://api.github.com/user/emails",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()


def create_jwt_cookie(response: Response, github_login: str) -> None:
    """Set the session JWT cookie."""
    expire = datetime.now(UTC) + timedelta(days=JWT_EXPIRE_DAYS)
    token = jwt.encode(
        {
            "sub": github_login,
            "exp": expire,
            "iat": datetime.now(UTC),
            "jti": secrets.token_hex(16),
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    # Use secure=False for local HTTP dev, True for HTTPS production
    is_secure = FRONTEND_URL.startswith("https://")
    # For localhost dev, set domain to "localhost" so cookie works across ports
    is_localhost = "localhost" in FRONTEND_URL
    cookie_domain = "localhost" if is_localhost else None
    response.set_cookie(
        key=JWT_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        domain=cookie_domain,
        max_age=int(timedelta(days=JWT_EXPIRE_DAYS).total_seconds()),
    )


def clear_jwt_cookie(response: Response) -> None:
    """Clear the session JWT cookie."""
    is_secure = FRONTEND_URL.startswith("https://")
    is_localhost = "localhost" in FRONTEND_URL
    cookie_domain = "localhost" if is_localhost else None
    response.delete_cookie(
        key=JWT_COOKIE_NAME, httponly=True, secure=is_secure, domain=cookie_domain
    )


def get_current_user_from_cookie(request: Request) -> dict | None:
    """Decode JWT cookie and return user dict, or None if invalid."""
    token = request.cookies.get(JWT_COOKIE_NAME)
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        login = payload.get("sub")
        if not login:
            return None
        user = get_user(login)
        return user
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(request: Request) -> dict:
    """FastAPI dependency: user must be authenticated (any role)."""
    user = get_current_user_from_cookie(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_curator(request: Request) -> dict:
    """FastAPI dependency: user must be curator or admin."""
    user = require_auth(request)
    if user["role"] not in ("curator", "admin"):
        raise HTTPException(status_code=403, detail="Curator privileges required")
    return user


def require_admin(request: Request) -> dict:
    """FastAPI dependency: user must be admin."""
    user = require_auth(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


# In-memory state storage (use Redis in production)
_state_storage: dict = {}


@router.get("/github")
async def auth_github():
    """Redirect to GitHub OAuth authorize URL."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    # Generate CSRF state token
    state = secrets.token_urlsafe(32)
    _state_storage[state] = datetime.now(UTC)

    redirect_uri = f"{FRONTEND_URL}/api/auth/callback"
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=user:email"
        f"&state={state}"
    )
    return RedirectResponse(url=url)


@router.get("/callback")
async def auth_callback(response: Response, code: str, state: str = ""):
    """Handle GitHub OAuth callback, issue JWT cookie."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    # Validate CSRF state token
    if not state or state not in _state_storage:
        raise HTTPException(
            status_code=400, detail="Invalid or missing state parameter"
        )

    # Clean up used state
    del _state_storage[state]
    # Remove expired states (> 10 minutes)
    cutoff = datetime.now(UTC) - timedelta(minutes=10)
    expired = [k for k, v in _state_storage.items() if v < cutoff]
    for k in expired:
        del _state_storage[k]

    # Exchange code for token
    token_data = _github_access_token(code)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="GitHub access_token missing")

    # Fetch user profile
    profile = _github_user_info(access_token)
    login = profile.get("login", "").lower()
    name = profile.get("name", "")
    avatar_url = profile.get("avatar_url", "")

    # Fetch primary email
    emails = _github_user_emails(access_token)
    email = ""
    for e in emails:
        if e.get("primary"):
            email = e.get("email", "")
            break
    if not email and emails:
        email = emails[0].get("email", "")

    # Look up user in DB
    user = get_user(login)
    if user is None:
        all_users = list_all_users(limit=1)
        if not all_users and login in ADMIN_GITHUB_LOGINS:
            role = "admin"
        else:
            role = "pending"
        create_user(
            github_login=login,
            name=name,
            email=email,
            avatar_url=avatar_url,
            role=role,
        )
        user = get_user(login)

    # Issue JWT cookie on the redirect response
    redirect_response = RedirectResponse(url=f"{FRONTEND_URL}/")
    create_jwt_cookie(redirect_response, login)
    return redirect_response


@router.post("/logout")
async def auth_logout(response: Response):
    """Clear the session cookie."""
    clear_jwt_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def auth_me(request: Request):
    """Return current authenticated user info."""
    user = get_current_user_from_cookie(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse(
        github_login=user["github_login"],
        name=user["name"],
        email=user["email"],
        avatar_url=user.get("avatar_url"),
        role=user["role"],
    )
