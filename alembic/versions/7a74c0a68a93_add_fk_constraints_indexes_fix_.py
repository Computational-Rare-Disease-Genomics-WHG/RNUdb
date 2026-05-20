"""Add FK constraints, indexes, fix Literature.year type

Revision ID: 7a74c0a68a93
Revises: 22820da06f25
Create Date: 2026-05-20 15:40:00.192698

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7a74c0a68a93"
down_revision: str | Sequence[str] | None = "22820da06f25"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("annotations") as batch_op:
        batch_op.create_foreign_key(
            "fk_annotations_structure_id", "rna_structures", ["structure_id"], ["id"]
        )

    with op.batch_alter_table("base_pairs") as batch_op:
        batch_op.create_foreign_key(
            "fk_base_pairs_structure_id", "rna_structures", ["structure_id"], ["id"]
        )

    with op.batch_alter_table("bed_tracks") as batch_op:
        batch_op.create_index("ix_bed_tracks_geneId", ["geneId"], unique=False)
        batch_op.create_foreign_key("fk_bed_tracks_geneId", "genes", ["geneId"], ["id"])

    with op.batch_alter_table("literature") as batch_op:
        batch_op.alter_column(
            "year",
            existing_type=sa.VARCHAR(),
            type_=sa.Integer(),
            existing_nullable=False,
        )

    with op.batch_alter_table("nucleotides") as batch_op:
        batch_op.create_foreign_key(
            "fk_nucleotides_structure_id", "rna_structures", ["structure_id"], ["id"]
        )

    with op.batch_alter_table("pending_changes") as batch_op:
        batch_op.create_index(
            "ix_pending_changes_requested_by", ["requested_by"], unique=False
        )

    with op.batch_alter_table("rna_structures") as batch_op:
        batch_op.create_index("ix_rna_structures_geneId", ["geneId"], unique=False)
        batch_op.create_foreign_key(
            "fk_rna_structures_geneId", "genes", ["geneId"], ["id"]
        )

    with op.batch_alter_table("structural_features") as batch_op:
        batch_op.create_foreign_key(
            "fk_structural_features_structure_id",
            "rna_structures",
            ["structure_id"],
            ["id"],
        )

    with op.batch_alter_table("variant_classifications") as batch_op:
        batch_op.create_foreign_key(
            "fk_variant_classifications_variant_id", "variants", ["variant_id"], ["id"]
        )
        batch_op.create_foreign_key(
            "fk_variant_classifications_literature_id",
            "literature",
            ["literature_id"],
            ["id"],
        )

    with op.batch_alter_table("variant_links") as batch_op:
        batch_op.create_foreign_key(
            "fk_variant_links_variant_id_2", "variants", ["variant_id_2"], ["id"]
        )
        batch_op.create_foreign_key(
            "fk_variant_links_variant_id_1", "variants", ["variant_id_1"], ["id"]
        )

    with op.batch_alter_table("variants") as batch_op:
        batch_op.create_index("ix_variants_geneId", ["geneId"], unique=False)
        batch_op.create_foreign_key("fk_variants_geneId", "genes", ["geneId"], ["id"])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("variants") as batch_op:
        batch_op.drop_constraint("fk_variants_geneId", type_="foreignkey")
        batch_op.drop_index("ix_variants_geneId")

    with op.batch_alter_table("variant_links") as batch_op:
        batch_op.drop_constraint("fk_variant_links_variant_id_1", type_="foreignkey")
        batch_op.drop_constraint("fk_variant_links_variant_id_2", type_="foreignkey")

    with op.batch_alter_table("variant_classifications") as batch_op:
        batch_op.drop_constraint(
            "fk_variant_classifications_literature_id", type_="foreignkey"
        )
        batch_op.drop_constraint(
            "fk_variant_classifications_variant_id", type_="foreignkey"
        )

    with op.batch_alter_table("structural_features") as batch_op:
        batch_op.drop_constraint(
            "fk_structural_features_structure_id", type_="foreignkey"
        )

    with op.batch_alter_table("rna_structures") as batch_op:
        batch_op.drop_constraint("fk_rna_structures_geneId", type_="foreignkey")
        batch_op.drop_index("ix_rna_structures_geneId")

    with op.batch_alter_table("pending_changes") as batch_op:
        batch_op.drop_index("ix_pending_changes_requested_by")

    with op.batch_alter_table("nucleotides") as batch_op:
        batch_op.drop_constraint("fk_nucleotides_structure_id", type_="foreignkey")

    with op.batch_alter_table("literature") as batch_op:
        batch_op.alter_column(
            "year",
            existing_type=sa.Integer(),
            type_=sa.VARCHAR(),
            existing_nullable=False,
        )

    with op.batch_alter_table("bed_tracks") as batch_op:
        batch_op.drop_constraint("fk_bed_tracks_geneId", type_="foreignkey")
        batch_op.drop_index("ix_bed_tracks_geneId")

    with op.batch_alter_table("base_pairs") as batch_op:
        batch_op.drop_constraint("fk_base_pairs_structure_id", type_="foreignkey")

    with op.batch_alter_table("annotations") as batch_op:
        batch_op.drop_constraint("fk_annotations_structure_id", type_="foreignkey")
