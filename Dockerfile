# Multi-stage build: Frontend + Backend with Distroless
# Elston N. D'Souza
# --------------------------------------------------
# Stage 1: Build frontend with Node
# --------------------------------------------------
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy frontend source
COPY src ./src
COPY public ./public
COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./

# Build frontend
RUN yarn build

# --------------------------------------------------
# Stage 2: Backend builder (Python + uv)
# --------------------------------------------------
FROM --platform=$BUILDPLATFORM debian:bookworm-slim AS backend-builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

# Install Python 3.11 and essentials
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python project files
COPY pyproject.toml uv.lock* ./
COPY api.py ./
COPY rnudb_utils ./rnudb_utils

# Create venv using Python 3.11
RUN python3.11 -m venv /app/.venv && \
    /app/.venv/bin/pip install --upgrade pip && \
    uv export --no-hashes > requirements.txt && \
    uv pip install --python=/app/.venv/bin/python -r requirements.txt

# --------------------------------------------------
# Stage 3: Final runtime (distroless, non-root)
# --------------------------------------------------
FROM gcr.io/distroless/python3-debian12:nonroot

WORKDIR /app

# Copy venv from backend-builder
COPY --from=backend-builder --chown=nonroot:nonroot /app/.venv /app/.venv

# Copy backend code
COPY --from=backend-builder --chown=nonroot:nonroot /app/api.py /app/
COPY --from=backend-builder --chown=nonroot:nonroot /app/rnudb_utils /app/rnudb_utils

# Copy built frontend
COPY --from=frontend-builder --chown=nonroot:nonroot /app/dist /app/dist

# Environment
ENV PYTHONPATH="/app/.venv/lib/python3.11/site-packages"
ENV PYTHONUNBUFFERED=1

# Expose FastAPI port
EXPOSE 8000

# Entrypoint - run FastAPI with uvicorn
ENTRYPOINT ["/app/.venv/bin/python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
