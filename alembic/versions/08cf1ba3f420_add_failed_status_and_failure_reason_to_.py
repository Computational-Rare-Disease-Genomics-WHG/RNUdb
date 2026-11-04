"""add failed status and failure_reason to pending_changes

Revision ID: 08cf1ba3f420
Revises: ed2f69106e20
Create Date: 2026-11-04 16:05:07.724963

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "08cf1ba3f420"
down_revision: str | Sequence[str] | None = "ed2f69106e20"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - allow 'failed' status and add failure_reason column."""
    # SQLite doesn't support ALTER TABLE to modify CHECK constraints,
    # so we recreate the table (same pattern as a7de7261403c) with the new
    # status + failure_reason column.
    op.execute("""
        CREATE TABLE pending_changes_new (
            entity_type VARCHAR NOT NULL,
            entity_id VARCHAR,
            gene_id VARCHAR NOT NULL,
            action VARCHAR NOT NULL,
            payload JSON,
            requested_by VARCHAR NOT NULL,
            requested_at DATETIME,
            status VARCHAR NOT NULL,
            reviewed_by VARCHAR,
            reviewed_at DATETIME,
            review_notes VARCHAR,
            id INTEGER NOT NULL,
            applied_at DATETIME,
            failure_reason VARCHAR,
            PRIMARY KEY (id),
            CONSTRAINT check_action CHECK (action IN ('create', 'update', 'delete', 'import')),
            CONSTRAINT check_entity_type CHECK (entity_type IN ('gene', 'variant', 'literature', 'structure', 'bed_track')),
            CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'failed'))
        )
    """)
    op.execute("""
        INSERT INTO pending_changes_new
            (entity_type, entity_id, gene_id, action, payload, requested_by,
             requested_at, status, reviewed_by, reviewed_at, review_notes,
             id, applied_at)
        SELECT
            entity_type, entity_id, gene_id, action, payload, requested_by,
            requested_at, status, reviewed_by, reviewed_at, review_notes,
            id, applied_at
        FROM pending_changes
    """)
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_new RENAME TO pending_changes")
    op.create_index(
        "ix_pending_changes_requested_by", "pending_changes", ["requested_by"]
    )


def downgrade() -> None:
    """Downgrade schema - revert check_status and drop failure_reason."""
    op.execute("""
        CREATE TABLE pending_changes_old (
            entity_type VARCHAR NOT NULL,
            entity_id VARCHAR,
            gene_id VARCHAR NOT NULL,
            action VARCHAR NOT NULL,
            payload JSON,
            requested_by VARCHAR NOT NULL,
            requested_at DATETIME,
            status VARCHAR NOT NULL,
            reviewed_by VARCHAR,
            reviewed_at DATETIME,
            review_notes VARCHAR,
            id INTEGER NOT NULL,
            applied_at DATETIME,
            PRIMARY KEY (id),
            CONSTRAINT check_action CHECK (action IN ('create', 'update', 'delete', 'import')),
            CONSTRAINT check_entity_type CHECK (entity_type IN ('gene', 'variant', 'literature', 'structure', 'bed_track')),
            CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied'))
        )
    """)
    op.execute("""
        INSERT INTO pending_changes_old
            (entity_type, entity_id, gene_id, action, payload, requested_by,
             requested_at, status, reviewed_by, reviewed_at, review_notes,
             id, applied_at)
        SELECT
            entity_type, entity_id, gene_id, action, payload, requested_by,
            requested_at, status, reviewed_by, reviewed_at, review_notes,
            id, applied_at
        FROM pending_changes
    """)
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_old RENAME TO pending_changes")
    op.create_index(
        "ix_pending_changes_requested_by", "pending_changes", ["requested_by"]
    )
