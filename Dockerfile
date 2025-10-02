# Multi-stage build: Frontend + Backend in one container

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Stage 2: Python backend builder
FROM python:3.13-slim AS backend-builder

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python project files
COPY pyproject.toml uv.lock* ./
COPY api.py ./
COPY rnudb_utils ./rnudb_utils

# Install Python dependencies with uv
RUN uv sync --frozen

# Stage 3: Runtime with distroless
FROM gcr.io/distroless/python3-debian12

# Copy Python virtual environment from builder
COPY --from=backend-builder /app/.venv /app/.venv

# Copy application files
COPY --from=backend-builder /app/api.py /app/
COPY --from=backend-builder /app/rnudb_utils /app/rnudb_utils

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Set environment variables
ENV PYTHONPATH="/app/.venv/lib/python3.13/site-packages"
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Expose port for FastAPI
EXPOSE 8000

# Run FastAPI with uvicorn directly from venv
ENTRYPOINT ["/app/.venv/bin/python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
