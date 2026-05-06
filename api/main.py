"""RNUdb FastAPI application."""

import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, ORJSONResponse
from fastapi.staticfiles import StaticFiles

from .routers import genes, literature, variants
from .routers.approvals import router as approvals_router
from .routers.auth import router as auth_router
from .routers.bed_tracks import router as bed_tracks_router
from .routers.imports import router as imports_router
from .routers.users import router as users_router

app = FastAPI(
    title="RNUdb API",
    description="API for RNUdb - RNA variant database and curation platform",
    default_response_class=ORJSONResponse,
)

# CORS: locked origin with credentials for cookie-based auth
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rnudb.rarediseasegenomics.org")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(genes.router, prefix="/api")
app.include_router(variants.router, prefix="/api")
app.include_router(literature.router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(users_router, prefix="/api/users")
app.include_router(imports_router, prefix="/api")
app.include_router(bed_tracks_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")

# Serve frontend static files
dist_path = Path(__file__).resolve().parent.parent / "dist"
if dist_path.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(dist_path / "assets")),
        name="assets",
    )

    # SPA fallback - serve index.html for all unmatched routes
    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str) -> FileResponse:
        """Serve index.html for SPA routing."""
        return FileResponse(str(dist_path / "index.html"))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
