---
name: database
description: Work with SQLAlchemy models and database patterns
---

# Database

SQLAlchemy patterns and conventions.

## Engine & ORM

- SQLite database
- Synchronous SQLAlchemy (no async)
- Alembic target_metadata from `api.models_sqlalchemy.Base.metadata`

## Session Patterns

Follow `rnudb_utils/database.py`. Sync only.

## Models

- Reuse existing base/model patterns from `api/models.py`
- No soft-delete convention
- Audit via AuditLog table

## Timestamps

`created_at` / `updated_at` not universal.
Check actual model first, don't assume.

## SQLAlchemy Rules

- Don't introduce async patterns
- Use existing session patterns
- Follow existing model conventions
