"""drop literature_id from equivalent_positions

Revision ID: fe0bd101a6b3
Revises: 506f18943cff
Create Date: 2026-11-24 12:14:42.977818

Equivalent positions are manually curated base-for-base pairs; the source
literature column was dropped because the pairs are derived from the guidance
rather than attributed to an individual paper. SQLite cannot drop a column
that participates in a foreign key, so the table is rebuilt.
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fe0bd101a6b3"
down_revision: str | Sequence[str] | None = "506f18943cff"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Rebuild equivalent_positions without the literature_id column."""
    op.execute("""
        CREATE TABLE equivalent_positions_new (
            gene_a VARCHAR NOT NULL,
            pos_a INTEGER NOT NULL,
            gene_b VARCHAR NOT NULL,
            pos_b INTEGER NOT NULL,
            notes VARCHAR,
            PRIMARY KEY (gene_a, pos_a),
            CONSTRAINT check_equiv_gene_order CHECK (gene_a < gene_b),
            FOREIGN KEY(gene_a) REFERENCES genes (id),
            FOREIGN KEY(gene_b) REFERENCES genes (id),
            CONSTRAINT uq_equiv_gene_b_pos UNIQUE (gene_b, pos_b)
        )
    """)
    op.execute("""
        INSERT INTO equivalent_positions_new
            (gene_a, pos_a, gene_b, pos_b, notes)
        SELECT gene_a, pos_a, gene_b, pos_b, notes
        FROM equivalent_positions
    """)
    op.execute("DROP TABLE equivalent_positions")
    op.execute("ALTER TABLE equivalent_positions_new RENAME TO equivalent_positions")


def downgrade() -> None:
    """Restore the literature_id column."""
    op.execute("""
        CREATE TABLE equivalent_positions_old (
            gene_a VARCHAR NOT NULL,
            pos_a INTEGER NOT NULL,
            gene_b VARCHAR NOT NULL,
            pos_b INTEGER NOT NULL,
            literature_id VARCHAR,
            notes VARCHAR,
            PRIMARY KEY (gene_a, pos_a),
            CONSTRAINT check_equiv_gene_order CHECK (gene_a < gene_b),
            FOREIGN KEY(gene_a) REFERENCES genes (id),
            FOREIGN KEY(gene_b) REFERENCES genes (id),
            FOREIGN KEY(literature_id) REFERENCES literature (id),
            CONSTRAINT uq_equiv_gene_b_pos UNIQUE (gene_b, pos_b)
        )
    """)
    op.execute("""
        INSERT INTO equivalent_positions_old
            (gene_a, pos_a, gene_b, pos_b, notes)
        SELECT gene_a, pos_a, gene_b, pos_b, notes
        FROM equivalent_positions
    """)
    op.execute("DROP TABLE equivalent_positions")
    op.execute("ALTER TABLE equivalent_positions_old RENAME TO equivalent_positions")
