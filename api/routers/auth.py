"""Authentication using Authlib with GitHub OAuth."""

import os
import secrets
from datetime import UTC, datetime, timedelta

import httpx
import jwt
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from api.models import UserResponse
from rnudb_utils.database import create_user, get_user, list_all_users

router = APIRouter()

# Config from environment
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rnudb.rarediseasegenomics.org")
ADMIN_GITHUB_LOGINS = [
    u.strip().lower()
    for u in os.environ.get("ADMIN_GITHUB_LOGINS", "").split(",")
    if u.strip()
]

JWT_ALGORITHM = "HS256"
JWT_COOKIE_NAME = "session"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# Initialize Authlib OAuth client
oauth = OAuth()

# Register GitHub OAuth client with PKCE
oauth.register(
    name="github",
    client_id=GITHUB_CLIENT_ID,
    client_secret=GITHUB_CLIENT_SECRET,
    access_token_url="https://github.com/login/oauth/access_token",  # noqa: S106
    authorize_url="https://github.com/login/oauth/authorize",  # noqa: S106
    api_base_url="https://api.github.com/",  # noqa: S106
    client_kwargs={
        "scope": "user:email",
    },
)


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


def create_session_token(response: Response, login: str, access_token: str) -> None:
    """Create JWT access token in cookie."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = secrets.token_hex(16)

    jwt_token = jwt.encode(
        {
            "sub": login,
            "type": "access",
            "exp": expire,
            "iat": now,
            "jti": jti,
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    is_secure = FRONTEND_URL.startswith("https://")
    is_localhost = "localhost" in FRONTEND_URL
    cookie_domain = "localhost" if is_localhost else None

    # Store access token in HTTP-only cookie
    response.set_cookie(
        key=JWT_COOKIE_NAME,
        value=jwt_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        domain=cookie_domain,
        max_age=int(timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES).total_seconds()),
    )


def clear_session_token(response: Response) -> None:
    """Clear session token cookie."""
    is_secure = FRONTEND_URL.startswith("https://")
    is_localhost = "localhost" in FRONTEND_URL
    cookie_domain = "localhost" if is_localhost else None

    response.delete_cookie(
        key=JWT_COOKIE_NAME,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        domain=cookie_domain,
    )


def get_user_from_request(request: Request) -> dict | None:
    """Get user from session (set by Authlib OAuth), or None if not authenticated."""
    # Use session from SessionMiddleware (request.session)
    session = getattr(request, "session", {})
    
    # Check for user in session
    login = session.get("user")
    
    # Fallback: also check JWT cookie for backwards compatibility
    if not login:
        token = request.cookies.get(JWT_COOKIE_NAME)
        if token:
            try:
                payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
                login = payload.get("sub")
            except Exception:
                pass
    
    if not login:
        return None

    user = get_user(login)
    return user


def require_auth(request: Request) -> dict:
    """FastAPI dependency: user must be authenticated (any role)."""
    user = get_user_from_request(request)
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


@router.get("/github")
async def auth_github(request: Request):
    """Redirect to GitHub OAuth authorize URL with PKCE."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    # Use Authlib's authorize_redirect which handles PKCE automatically
    redirect_uri = f"{FRONTEND_URL}/api/auth/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def auth_callback(request: Request, response: Response):
    """Handle GitHub OAuth callback, issue session token."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    try:
        # Exchange code for token using Authlib
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Authorization failed: {str(e)}"
        ) from e

    access_token = token.get("access_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="Access token missing")

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

    # Store user in session (SessionMiddleware provides this)
    request.session["user"] = login
    request.session["access_token"] = access_token
    
    # Issue session token (also set cookie for compatibility)
    redirect_response = RedirectResponse(url=f"{FRONTEND_URL}/")
    create_session_token(redirect_response, login, access_token)
    return redirect_response


@router.post("/logout")
async def auth_logout(request: Request, response: Response):
    """Clear session token."""
    clear_session_token(response)
    # Also clear session if available
    if hasattr(request, "session") and request.session:
        request.session.clear()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def auth_me(request: Request):
    """Return current authenticated user info."""
    user = require_auth(request)
    return UserResponse(
        github_login=user["github_login"],
        name=user["name"],
        email=user["email"],
        avatar_url=user.get("avatar_url"),
        role=user["role"],
    )


# Also export for use in other routers
def get_current_user(request: Request) -> dict | None:
    """Get current user from request."""
    return get_user_from_request(request)
