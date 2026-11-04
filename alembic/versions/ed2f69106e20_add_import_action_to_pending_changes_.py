"""add import action to pending_changes check constraint

Revision ID: ed2f69106e20
Revises: b051df0029e7
Create Date: 2026-11-04 15:51:08.287522

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ed2f69106e20"
down_revision: str | Sequence[str] | None = "b051df0029e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - allow 'import' action on pending_changes."""
    # SQLite doesn't support ALTER TABLE to modify CHECK constraints,
    # so we recreate the table (same pattern as a7de7261403c).
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
            PRIMARY KEY (id),
            CONSTRAINT check_action CHECK (action IN ('create', 'update', 'delete', 'import')),
            CONSTRAINT check_entity_type CHECK (entity_type IN ('gene', 'variant', 'literature', 'structure', 'bed_track')),
            CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied'))
        )
    """)
    op.execute("INSERT INTO pending_changes_new SELECT * FROM pending_changes")
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_new RENAME TO pending_changes")
    op.create_index(
        "ix_pending_changes_requested_by", "pending_changes", ["requested_by"]
    )


def downgrade() -> None:
    """Downgrade schema - revert check_action constraint."""
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
            CONSTRAINT check_action CHECK (action IN ('create', 'update', 'delete')),
            CONSTRAINT check_entity_type CHECK (entity_type IN ('gene', 'variant', 'literature', 'structure', 'bed_track')),
            CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied'))
        )
    """)
    op.execute("INSERT INTO pending_changes_old SELECT * FROM pending_changes")
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_old RENAME TO pending_changes")
    op.create_index(
        "ix_pending_changes_requested_by", "pending_changes", ["requested_by"]
    )
