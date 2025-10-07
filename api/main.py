from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn
import logging

from .routers import genes, variants, literature

logging.basicConfig(level=logging.INFO)

api_app = FastAPI(
    title="RNUdb API",
    description="Simple read-only API for RNAdb data",
    default_response_class=ORJSONResponse,
)

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@api_app.get("/")
async def root():
    return {"message": "RNUdb API - Simple read-only access to RNA database"}


api_app.include_router(genes.router)
api_app.include_router(variants.router)
api_app.include_router(literature.router)

# Create a root app that serves static files at / and mounts the API under /api
app = FastAPI(title="RNUdb (static + API gateway)")

# Mount the API app under /api first so it is not shadowed by the root static mount
app.mount("/api", api_app, name="api")

# Mount static files for frontend at / (only if dist exists - for production)
dist_path = Path(__file__).resolve().parent.parent / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")

if __name__ == "__main__":
    # Run the gateway app which serves the frontend and proxies API under /api
    uvicorn.run(app, host="0.0.0.0", port=8000)
