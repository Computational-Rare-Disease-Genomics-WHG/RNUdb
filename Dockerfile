# Multi-stage build: Frontend + Backend with Distroless
# Elston N. D'Souza
# --------------------------------------------------
# Stage 1: Build frontend with Node
# --------------------------------------------------
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY src ./src
COPY public ./public
COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./

# Build frontend
RUN npm run build

# --------------------------------------------------
# Stage 2: Backend builder (Python + uv)
# --------------------------------------------------
FROM --platform=$BUILDPLATFORM debian:bookworm-slim AS backend-builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

# Install Python 3.11 and essentials (including compilation tools for native extensions)
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy uv binary from official multi-platform image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python project files
COPY pyproject.toml uv.lock* ./
COPY alembic.ini ./
COPY alembic ./alembic
COPY api ./api
COPY rnudb_utils ./rnudb_utils

# Create venv and install dependencies using uv
# Force compilation from source for native extensions to ensure cross-arch compatibility
RUN uv venv --python 3.11 .venv && \
    uv sync --python .venv/bin/python --no-binary

# --------------------------------------------------
# Stage 3: Final runtime (distroless, non-root)
# --------------------------------------------------
FROM gcr.io/distroless/python3-debian12:nonroot

WORKDIR /app

# Copy venv from backend-builder
COPY --from=backend-builder --chown=nonroot:nonroot /app/.venv /app/.venv

# Copy alembic config and migrations
COPY --from=backend-builder --chown=nonroot:nonroot /app/alembic.ini /app/alembic.ini
COPY --from=backend-builder --chown=nonroot:nonroot /app/alembic /app/alembic

# Copy backend code
COPY --from=backend-builder --chown=nonroot:nonroot /app/api /app/api
COPY --from=backend-builder --chown=nonroot:nonroot /app/rnudb_utils /app/rnudb_utils

# Copy built frontend
COPY --from=frontend-builder --chown=nonroot:nonroot /app/dist /app/dist

# Environment
ENV PYTHONPATH="/app/.venv/lib/python3.11/site-packages"
ENV PYTHONUNBUFFERED=1

# Expose FastAPI port
EXPOSE 8000

# Entrypoint - run FastAPI with uvicorn
ENTRYPOINT ["/app/.venv/bin/python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
