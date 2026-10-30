"""remove functional_region evidence_direction mechanism_match from variant_equivalences

Revision ID: f1e659c3d839
Revises: c165b78b74b1
Create Date: 2026-10-30 13:40:54.417593

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1e659c3d839"
down_revision: str | Sequence[str] | None = "c165b78b74b1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema — rebuild variant_equivalences without the
    functional_region, evidence_direction and mechanism_match columns (and
    their CHECK constraints), which are unnecessary for clinical
    interpretation. The old table is dropped (data discarded per user request —
    the cleaned CSV will be re-imported)."""
    # SQLite cannot DROP COLUMN when a CHECK constraint references it, so we
    # must recreate the table.
    op.execute("""
        CREATE TABLE variant_equivalences_new (
            variant_id VARCHAR NOT NULL,
            equivalent_variant_id VARCHAR NOT NULL,
            relationship_type VARCHAR NOT NULL,
            status VARCHAR,
            notes VARCHAR,
            literature_id VARCHAR,
            PRIMARY KEY (variant_id, equivalent_variant_id),
            CONSTRAINT check_ordered_pair CHECK (variant_id < equivalent_variant_id),
            CONSTRAINT check_relationship_type
                CHECK (relationship_type IN ('paralog', 'analog'))
        )
    """)
    op.execute("DROP TABLE variant_equivalences")
    op.execute("ALTER TABLE variant_equivalences_new RENAME TO variant_equivalences")


def downgrade() -> None:
    """Downgrade — restore the removed columns (rows created after the upgrade
    migrate back; the discarded column values are lost)."""
    op.execute("""
        CREATE TABLE variant_equivalences_old (
            variant_id VARCHAR NOT NULL,
            equivalent_variant_id VARCHAR NOT NULL,
            relationship_type VARCHAR NOT NULL,
            mechanism_match VARCHAR NOT NULL,
            functional_region VARCHAR,
            evidence_direction VARCHAR NOT NULL,
            status VARCHAR,
            notes VARCHAR,
            literature_id VARCHAR,
            PRIMARY KEY (variant_id, equivalent_variant_id),
            CONSTRAINT check_ordered_pair CHECK (variant_id < equivalent_variant_id),
            CONSTRAINT check_relationship_type
                CHECK (relationship_type IN ('paralog', 'analog')),
            CONSTRAINT check_mechanism_match
                CHECK (mechanism_match IN ('same', 'different', 'unknown')),
            CONSTRAINT check_evidence_direction
                CHECK (evidence_direction IN ('pathogenic', 'benign', 'both'))
        )
    """)
    op.execute(
        "INSERT INTO variant_equivalences_old "
        "(variant_id, equivalent_variant_id, relationship_type, "
        " status, notes, literature_id) "
        "SELECT variant_id, equivalent_variant_id, relationship_type, "
        "       status, notes, literature_id "
        "FROM variant_equivalences"
    )
    op.execute("DROP TABLE variant_equivalences")
    op.execute("ALTER TABLE variant_equivalences_old RENAME TO variant_equivalences")
