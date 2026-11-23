"""add equivalent_positions table and is_synthetic to variants

Revision ID: 506f18943cff
Revises: 08cf1ba3f420
Create Date: 2026-11-23 18:13:44.504639

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "506f18943cff"
down_revision: str | Sequence[str] | None = "08cf1ba3f420"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "equivalent_positions",
        sa.Column("gene_a", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("pos_a", sa.Integer(), nullable=False),
        sa.Column("gene_b", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("pos_b", sa.Integer(), nullable=False),
        sa.Column("literature_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("notes", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.CheckConstraint("gene_a < gene_b", name="check_equiv_gene_order"),
        sa.ForeignKeyConstraint(["gene_a"], ["genes.id"]),
        sa.ForeignKeyConstraint(["gene_b"], ["genes.id"]),
        sa.ForeignKeyConstraint(["literature_id"], ["literature.id"]),
        sa.PrimaryKeyConstraint("gene_a", "pos_a"),
        sa.UniqueConstraint("gene_b", "pos_b", name="uq_equiv_gene_b_pos"),
    )
    op.add_column("variants", sa.Column("is_synthetic", sa.Boolean(), nullable=True))

    # Rebuild pending_changes to add 'equivalence' to entity_type whitelist,
    # preserving main's existing action/status constraints.
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
            CONSTRAINT check_action
                CHECK (action IN ('create', 'update', 'delete', 'import')),
            CONSTRAINT check_entity_type
                CHECK (entity_type IN ('gene','variant','literature','structure',
                                       'bed_track','equivalence')),
            CONSTRAINT check_status
                CHECK (status IN ('pending','approved','rejected','applied','failed'))
        )
    """)
    op.execute("INSERT INTO pending_changes_new SELECT * FROM pending_changes")
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_new RENAME TO pending_changes")


def downgrade() -> None:
    """Downgrade schema."""
    # Revert pending_changes to old entity_type whitelist.
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
            failure_reason VARCHAR,
            PRIMARY KEY (id),
            CONSTRAINT check_action
                CHECK (action IN ('create', 'update', 'delete', 'import')),
            CONSTRAINT check_entity_type
                CHECK (entity_type IN ('gene','variant','literature','structure',
                                       'bed_track')),
            CONSTRAINT check_status
                CHECK (status IN ('pending','approved','rejected','applied','failed'))
        )
    """)
    op.execute("INSERT INTO pending_changes_old SELECT * FROM pending_changes")
    op.execute("DROP TABLE pending_changes")
    op.execute("ALTER TABLE pending_changes_old RENAME TO pending_changes")
    op.drop_column("variants", "is_synthetic")
    op.drop_table("equivalent_positions")
