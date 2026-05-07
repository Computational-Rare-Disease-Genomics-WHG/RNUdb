"""fix pending_changes status check constraint to include applied

Revision ID: a7de7261403c
Revises: 045f796c6091
Create Date: 2026-05-06 18:42:41.856889

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7de7261403c'
down_revision: Union[str, Sequence[str], None] = '045f796c6091'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - fix check_status constraint to allow 'applied'."""
    # SQLite doesn't support ALTER TABLE to modify CHECK constraints
    # So we need to recreate the table
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
            CONSTRAINT check_action CHECK (action IN ('create', 'update', 'delete')), 
            CONSTRAINT check_entity_type CHECK (entity_type IN ('gene', 'variant', 'literature', 'structure', 'bed_track')), 
            CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied'))
        )
    """)
    op.execute("INSERT INTO pending_changes_new SELECT * FROM pending_changes")
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_new RENAME TO pending_changes")


def downgrade() -> None:
    """Downgrade schema - revert check_status constraint."""
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
            CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
        )
    """)
    op.execute("INSERT INTO pending_changes_old SELECT * FROM pending_changes")
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_old RENAME TO pending_changes")
