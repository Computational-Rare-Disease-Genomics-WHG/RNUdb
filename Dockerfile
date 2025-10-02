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

# Stage 2: Python backend with uv
FROM python:3.13-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python project files
COPY pyproject.toml ./
COPY api.py ./
COPY rnudb_utils ./rnudb_utils

# Install Python dependencies
RUN uv sync --frozen

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Expose port for FastAPI
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uv", "run", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
