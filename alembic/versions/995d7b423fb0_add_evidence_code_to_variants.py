"""add evidence_code to variants

Revision ID: 995d7b423fb0
Revises: fe0bd101a6b3
Create Date: 2026-11-24 15:14:41.103657

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "995d7b423fb0"
down_revision: str | Sequence[str] | None = "fe0bd101a6b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add the evidence_code column to the variants table."""
    op.add_column(
        "variants",
        sa.Column("evidence_code", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )


def downgrade() -> None:
    """Remove the evidence_code column from the variants table."""
    op.drop_column("variants", "evidence_code")
