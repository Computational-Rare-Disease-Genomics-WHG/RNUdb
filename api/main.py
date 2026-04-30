from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn
import logging

from .routers import genes, variants, literature

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="RNUdb API",
    description="Simple read-only API for RNAdb data",
    default_response_class=ORJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(genes.router, prefix="/api")
app.include_router(variants.router, prefix="/api")
app.include_router(literature.router, prefix="/api")

# Serve frontend static files
dist_path = Path(__file__).resolve().parent.parent / "dist"
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_path / "assets")), name="assets")

    # SPA fallback - serve index.html for all unmatched routes
    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        return FileResponse(str(dist_path / "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
