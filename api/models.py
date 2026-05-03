"""SQLModel models for RNUdb - Unified ORM + API validation."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlmodel import (
    JSON,
    CheckConstraint,
    Column,
    DateTime,
    Field,
    Integer,
    PrimaryKeyConstraint,
    SQLModel,
)

# ---------------------------------------------------------------------------
# Gene models
# ---------------------------------------------------------------------------


class GeneBase(SQLModel):
    """Shared Gene fields."""

    id: str = Field(primary_key=True)
    name: str
    fullName: str
    chromosome: str
    start: int
    end: int
    strand: str
    sequence: str
    description: str


class Gene(GeneBase, table=True):
    """Gene table model."""

    __tablename__ = "genes"


class GeneCreate(GeneBase):
    """Gene creation input."""


class GeneUpdate(SQLModel):
    """Gene update input (all optional)."""

    name: str | None = None
    fullName: str | None = None
    chromosome: str | None = None
    start: int | None = None
    end: int | None = None
    strand: str | None = None
    sequence: str | None = None
    description: str | None = None


class GenePublic(GeneBase):
    """Gene public output."""


# ---------------------------------------------------------------------------
# Variant models
# ---------------------------------------------------------------------------


class VariantBase(SQLModel):
    """Shared Variant fields."""

    id: str = Field(primary_key=True)
    geneId: str
    position: int
    nucleotidePosition: int | None = None
    ref: str
    alt: str
    hgvs: str | None = None
    consequence: str | None = None
    clinvar_significance: str | None = None
    clinical_significance: str | None = None
    disease_type: str | None = None
    pmid: str | None = None
    function_score: float | None = None
    pvalues: float | None = None
    qvalues: float | None = None
    depletion_group: str | None = None
    gnomad_ac: int | None = None
    gnomad_hom: int | None = None
    aou_ac: int | None = None
    aou_hom: int | None = None
    ukbb_ac: int | None = None
    ukbb_hom: int | None = None
    cadd_score: float | None = None
    zygosity: str | None = None
    cohort: str | None = None


class Variant(VariantBase, table=True):
    """Variant table model."""

    __tablename__ = "variants"


class VariantCreate(VariantBase):
    """Variant creation input."""


class VariantUpdate(SQLModel):
    """Variant update input (all optional)."""

    position: int | None = None
    nucleotidePosition: int | None = None
    ref: str | None = None
    alt: str | None = None
    hgvs: str | None = None
    consequence: str | None = None
    clinvar_significance: str | None = None
    clinical_significance: str | None = None
    disease_type: str | None = None
    pmid: str | None = None
    function_score: float | None = None
    pvalues: float | None = None
    qvalues: float | None = None
    depletion_group: str | None = None
    gnomad_ac: int | None = None
    gnomad_hom: int | None = None
    aou_ac: int | None = None
    aou_hom: int | None = None
    ukbb_ac: int | None = None
    ukbb_hom: int | None = None
    cadd_score: float | None = None
    zygosity: str | None = None
    cohort: str | None = None


class VariantPublic(VariantBase):
    """Variant public output."""

    linkedVariantIds: list[str] | None = None


# ---------------------------------------------------------------------------
# Literature models
# ---------------------------------------------------------------------------


class LiteratureBase(SQLModel):
    """Shared Literature fields."""

    id: str = Field(primary_key=True)
    title: str
    authors: str
    journal: str
    year: str
    doi: str


class Literature(LiteratureBase, table=True):
    """Literature table model."""

    __tablename__ = "literature"


class LiteratureCreate(LiteratureBase):
    """Literature creation input."""


class LiteratureUpdate(SQLModel):
    """Literature update input (all optional)."""

    title: str | None = None
    authors: str | None = None
    journal: str | None = None
    year: str | None = None
    doi: str | None = None


class LiteraturePublic(LiteratureBase):
    """Literature public output."""


# ---------------------------------------------------------------------------
# LiteratureCount model (table only, simple)
# ---------------------------------------------------------------------------


class LiteratureCount(SQLModel, table=True):
    """Variant-literature relationship table."""

    __tablename__ = "literature_counts"
    __table_args__ = (PrimaryKeyConstraint("variant_id", "literature_id"),)

    variant_id: str = Field(primary_key=True)
    literature_id: str = Field(primary_key=True)
    counts: int


# ---------------------------------------------------------------------------
# RNAStructure models
# ---------------------------------------------------------------------------


class RNAStructureBase(SQLModel):
    """Shared RNAStructure fields."""

    id: str = Field(primary_key=True)
    geneId: str


class RNAStructure(RNAStructureBase, table=True):
    """RNAStructure table model."""

    __tablename__ = "rna_structures"


# Nucleotide model (for structure data)
class Nucleotide(SQLModel, table=True):
    """Nucleotide coordinates table."""

    __tablename__ = "nucleotides"
    __table_args__ = (PrimaryKeyConstraint("id", "structure_id"),)

    id: int = Field(primary_key=True)
    structure_id: str = Field(primary_key=True)
    base: str
    x: float
    y: float


# BasePair model (for structure data)
class BasePair(SQLModel, table=True):
    """Base pairing information table."""

    __tablename__ = "base_pairs"
    __table_args__ = (PrimaryKeyConstraint("structure_id", "from_pos", "to_pos"),)

    structure_id: str = Field(primary_key=True)
    from_pos: int = Field(primary_key=True)
    to_pos: int = Field(primary_key=True)


# Annotation model (for structure data)
class Annotation(SQLModel, table=True):
    """Structure annotations table."""

    __tablename__ = "annotations"
    __table_args__ = (PrimaryKeyConstraint("id", "structure_id"),)

    id: str = Field(primary_key=True)
    structure_id: str = Field(primary_key=True)
    text: str
    x: float
    y: float
    font_size: int
    color: str | None = None


# StructuralFeature model (for structure data)
class StructuralFeature(SQLModel, table=True):
    """Structural features table."""

    __tablename__ = "structural_features"
    __table_args__ = (PrimaryKeyConstraint("id", "structure_id"),)

    id: str = Field(primary_key=True)
    structure_id: str = Field(primary_key=True)
    feature_type: str
    nucleotide_ids: str
    label_text: str
    label_x: float
    label_y: float
    label_font_size: int
    label_color: str | None = None
    description: str | None = None
    color: str | None = None


# ---------------------------------------------------------------------------
# VariantLink model (table only)
# ---------------------------------------------------------------------------


class VariantLink(SQLModel, table=True):
    """Biallelic variant relationships table."""

    __tablename__ = "variant_links"
    __table_args__ = (
        PrimaryKeyConstraint("variant_id_1", "variant_id_2"),
        CheckConstraint("variant_id_1 < variant_id_2"),
    )

    variant_id_1: str = Field(primary_key=True)
    variant_id_2: str = Field(primary_key=True)


# ---------------------------------------------------------------------------
# User models
# ---------------------------------------------------------------------------


class UserBase(SQLModel):
    """Shared User fields."""

    github_login: str = Field(primary_key=True)
    name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    role: str


class User(UserBase, table=True):
    """User table model."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('guest', 'pending', 'curator', 'admin')",
            name="check_role",
        ),
    )

    created_at: datetime | None = Field(
        default_factory=lambda: datetime.utcnow(),
        sa_column=Column(DateTime, nullable=True),
    )
    updated_at: datetime | None = Field(
        default_factory=lambda: datetime.utcnow(),
        sa_column=Column(DateTime, nullable=True, onupdate=datetime.utcnow()),
    )


class UserCreate(UserBase):
    """User creation input."""


class UserPublic(UserBase):
    """User public output (for API response)."""

    created_at: datetime | None = None
    updated_at: datetime | None = None


# Alias for backward compatibility
UserResponse = UserPublic


# ---------------------------------------------------------------------------
# AuditLog model (table only)
# ---------------------------------------------------------------------------


class AuditLog(SQLModel, table=True):
    """Audit trail table."""

    __tablename__ = "audit_log"
    __table_args__ = (
        CheckConstraint(
            "action IN ('CREATE', 'UPDATE', 'DELETE')", name="check_action"
        ),
    )

    id: int | None = Field(
        default=None,
        sa_column=Column(Integer, primary_key=True, autoincrement=True),
    )
    table_name: str
    record_id: str | None = None
    action: str
    old_values: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )
    new_values: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )
    user_login: str
    timestamp: datetime | None = Field(
        default_factory=lambda: datetime.utcnow(),
        sa_column=Column(DateTime, nullable=True),
    )


# ---------------------------------------------------------------------------
# BedTrack models
# ---------------------------------------------------------------------------


class BedTrackBase(SQLModel):
    """Shared BedTrack fields."""

    geneId: str
    track_name: str
    chrom: str
    interval_start: int
    interval_end: int
    label: str | None = None
    score: float | None = None
    color: str | None = None


class BedTrack(BedTrackBase, table=True):
    """BedTrack table model."""

    __tablename__ = "bed_tracks"

    id: int | None = Field(
        default=None,
        sa_column=Column(Integer, primary_key=True, autoincrement=True),
    )
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.utcnow(),
        sa_column=Column(DateTime, nullable=True),
    )
    created_by: str


class BedTrackCreate(BedTrackBase):
    """BedTrack creation input."""

    created_by: str


class BedTrackPublic(BedTrackBase):
    """BedTrack public output."""

    id: int
    created_at: str | None = None
    created_by: str


# Alias for backward compatibility
BEDTrack = BedTrackPublic


# ---------------------------------------------------------------------------
# PendingChange models
# ---------------------------------------------------------------------------


class PendingChangeBase(SQLModel):
    """Shared PendingChange fields."""

    entity_type: str
    entity_id: str | None = None
    gene_id: str
    action: str
    payload: dict[str, Any] = Field(sa_column=Column(JSON))
    requested_by: str
    requested_at: datetime | None = Field(default_factory=lambda: datetime.utcnow())
    status: str = "pending"
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None
    applied_at: datetime | None = None


class PendingChange(PendingChangeBase, table=True):
    """PendingChange table model."""

    __tablename__ = "pending_changes"
    __table_args__ = (
        CheckConstraint(
            "entity_type IN ('gene', 'variant', 'literature', 'structure', "
            "'bed_track')",
            name="check_entity_type",
        ),
        CheckConstraint(
            "action IN ('create', 'update', 'delete')",
            name="check_action",
        ),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'applied')",
            name="check_status",
        ),
    )

    id: int | None = Field(
        default=None, sa_column=Column(Integer, primary_key=True, autoincrement=True)
    )


class PendingChangeCreate(PendingChangeBase):
    """PendingChange creation input."""


class PendingChangePublic(PendingChangeBase):
    """PendingChange public output."""

    id: int


# Alias for backward compatibility
PendingChangeOut = PendingChangePublic


# ---------------------------------------------------------------------------
# Import-related models (API only, no table)
# ---------------------------------------------------------------------------


class VariantBatchImportRequest(SQLModel):
    """Batch variant import request."""

    geneId: str
    variants: list[dict[str, Any]]
    field_mapping: dict[str, str] | None = None
    skip_invalid: bool = True


class StructureImportRequest(SQLModel):
    """Structure import request."""

    geneId: str
    structure: dict[str, Any]
    set_primary: bool = False


class BEDTrackImportRequest(SQLModel):
    """BED track import request."""

    geneId: str
    track_name: str
    intervals: list[dict[str, Any]]
    color: str | None = None


class ValidationErrorModel(SQLModel):
    """Validation error model."""

    row: int
    field: str
    message: str
    value: Any = None


class ValidationReportResponse(SQLModel):
    """Validation report response."""

    valid: bool
    errors: list[ValidationErrorModel]
    warnings: list[ValidationErrorModel]
    valid_count: int
    total_count: int


class ImportResult(SQLModel):
    """Import result response."""

    success: bool
    imported_count: int
    skipped_count: int
    errors: list[ValidationErrorModel]
    warnings: list[ValidationErrorModel]


# ---------------------------------------------------------------------------
# RNAStructure API models (for requests/responses with nested data)
# ---------------------------------------------------------------------------


class NucleotideModel(SQLModel):
    """Nucleotide model for API."""

    id: int
    base: str
    x: float
    y: float


class BasePairModel(SQLModel):
    """BasePair model for API."""

    from_pos: int
    to_pos: int


class Config:
    populate_by_name = True


class AnnotationModel(SQLModel):
    """Annotation model for API."""

    id: str
    text: str
    x: float
    y: float
    font_size: int
    color: str | None = None


class StructuralFeatureLabel(SQLModel):
    """Structural feature label model for API."""

    text: str
    x: float
    y: float
    font_size: int
    color: str | None = None


class StructuralFeatureModel(SQLModel):
    """Structural feature model for API."""

    id: str
    feature_type: str
    nucleotide_ids: list[int]
    label_text: str
    label_x: float
    label_y: float
    label_font_size: int
    label_color: str | None = None
    description: str | None = None
    color: str | None = None


class RNAStructureCreate(SQLModel):
    """RNA structure creation input."""

    id: str
    gene_id: str
    nucleotides: list[NucleotideModel]
    base_pairs: list[BasePairModel]
    annotations: list[AnnotationModel] | None = []
    structural_features: list[StructuralFeatureModel] | None = []


__all__ = [
    # Gene models
    "Gene",
    "GeneCreate",
    "GeneUpdate",
    "GenePublic",
    # Variant models
    "Variant",
    "VariantCreate",
    "VariantUpdate",
    "VariantPublic",
    # Literature models
    "Literature",
    "LiteratureCreate",
    "LiteratureUpdate",
    "LiteraturePublic",
    # LiteratureCount
    "LiteratureCount",
    # RNAStructure models
    "RNAStructure",
    "Nucleotide",
    "BasePair",
    "Annotation",
    "StructuralFeature",
    # VariantLink
    "VariantLink",
    # User models
    "User",
    "UserCreate",
    "UserPublic",
    "UserResponse",
    # AuditLog
    "AuditLog",
    # BedTrack models
    "BedTrack",
    "BedTrackCreate",
    "BedTrackPublic",
    "BEDTrack",
    # PendingChange models
    "PendingChange",
    "PendingChangeCreate",
    "PendingChangePublic",
    "PendingChangeOut",
    # Import-related models
    "VariantBatchImportRequest",
    "StructureImportRequest",
    "BEDTrackImportRequest",
    "ValidationErrorModel",
    "ValidationReportResponse",
    "ImportResult",
    # RNAStructure API models
    "NucleotideModel",
    "BasePairModel",
    "AnnotationModel",
    "StructuralFeatureModel",
    "RNAStructureCreate",
]
