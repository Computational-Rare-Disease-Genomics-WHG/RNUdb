from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class SnRNAGene(BaseModel):
    id: str
    name: str
    fullName: str
    chromosome: str
    start: int
    end: int
    strand: str
    sequence: str
    description: str


class Variant(BaseModel):
    id: str
    geneId: str
    position: int
    nucleotidePosition: Optional[int] = None
    ref: str
    alt: str
    hgvs: Optional[str] = None
    consequence: Optional[str] = None
    clinvar_significance: Optional[str] = None
    clinical_significance: Optional[str] = None
    pmid: Optional[str] = None
    function_score: Optional[float] = None
    pvalues: Optional[float] = None
    qvalues: Optional[float] = None
    depletion_group: Optional[str] = None
    gnomad_ac: Optional[int] = None
    gnomad_hom: Optional[int] = None
    aou_ac: Optional[int] = None
    aou_hom: Optional[int] = None
    ukbb_ac: Optional[int] = None
    ukbb_hom: Optional[int] = None
    cadd_score: Optional[float] = None
    zygosity: Optional[str] = None
    cohort: Optional[str] = None
    linkedVariantIds: Optional[List[str]] = None


class Literature(BaseModel):
    id: str
    title: str
    authors: str
    journal: str
    year: str
    doi: str


class UserResponse(BaseModel):
    github_login: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    role: str


class GeneCreate(BaseModel):
    id: str
    name: str
    fullName: str
    chromosome: str
    start: int
    end: int
    strand: str
    sequence: str
    description: str


class GeneUpdate(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = None
    chromosome: Optional[str] = None
    start: Optional[int] = None
    end: Optional[int] = None
    strand: Optional[str] = None
    sequence: Optional[str] = None
    description: Optional[str] = None


class LiteratureCounts(BaseModel):
    variant_id: str
    literature_id: str
    counts: int


class Nucleotide(BaseModel):
    id: int
    base: str
    x: float
    y: float


class BasePair(BaseModel):
    from_: int = Field(alias="from")
    to: int

    class Config:
        populate_by_name = True


class AnnotationLabel(BaseModel):
    id: str
    text: str
    x: float
    y: float
    fontSize: int
    color: Optional[str] = None


class StructuralFeatureLabel(BaseModel):
    text: str
    x: float
    y: float
    fontSize: int
    color: Optional[str] = None


class VariantCreate(BaseModel):
    id: str
    geneId: str
    position: int
    nucleotidePosition: Optional[int] = None
    ref: str
    alt: str
    hgvs: Optional[str] = None
    consequence: Optional[str] = None
    clinvar_significance: Optional[str] = None
    clinical_significance: Optional[str] = None
    pmid: Optional[str] = None
    function_score: Optional[float] = None
    pvalues: Optional[float] = None
    qvalues: Optional[float] = None
    depletion_group: Optional[str] = None
    gnomad_ac: Optional[int] = None
    gnomad_hom: Optional[int] = None
    aou_ac: Optional[int] = None
    aou_hom: Optional[int] = None
    ukbb_ac: Optional[int] = None
    ukbb_hom: Optional[int] = None
    cadd_score: Optional[float] = None
    zygosity: Optional[str] = None
    cohort: Optional[str] = None


class VariantUpdate(BaseModel):
    position: Optional[int] = None
    nucleotidePosition: Optional[int] = None
    ref: Optional[str] = None
    alt: Optional[str] = None
    hgvs: Optional[str] = None
    consequence: Optional[str] = None
    clinvar_significance: Optional[str] = None
    clinical_significance: Optional[str] = None
    pmid: Optional[str] = None
    function_score: Optional[float] = None
    pvalues: Optional[float] = None
    qvalues: Optional[float] = None
    depletion_group: Optional[str] = None
    gnomad_ac: Optional[int] = None
    gnomad_hom: Optional[int] = None
    aou_ac: Optional[int] = None
    aou_hom: Optional[int] = None
    ukbb_ac: Optional[int] = None
    ukbb_hom: Optional[int] = None
    cadd_score: Optional[float] = None
    zygosity: Optional[str] = None
    cohort: Optional[str] = None


class LiteratureCreate(BaseModel):
    id: str
    title: str
    authors: str
    journal: str
    year: str
    doi: str


class LiteratureUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    journal: Optional[str] = None
    year: Optional[str] = None
    doi: Optional[str] = None


class StructuralFeature(BaseModel):
    id: str
    featureType: str
    nucleotideIds: List[int]
    label: StructuralFeatureLabel
    description: Optional[str] = None
    color: Optional[str] = None


class RNAStructure(BaseModel):
    id: str
    geneId: str
    nucleotides: List[Nucleotide]
    basePairs: List[BasePair]
    annotations: Optional[List[AnnotationLabel]] = []
    structuralFeatures: Optional[List[StructuralFeature]] = []


# Import-related models

class VariantBatchImportRequest(BaseModel):
    geneId: str
    variants: List[Dict[str, Any]]
    field_mapping: Optional[Dict[str, str]] = None
    skip_invalid: bool = True


class StructureImportRequest(BaseModel):
    geneId: str
    structure: Dict[str, Any]
    set_primary: bool = False


class BEDTrackImportRequest(BaseModel):
    geneId: str
    track_name: str
    intervals: List[Dict[str, Any]]
    color: Optional[str] = None


class ValidationErrorModel(BaseModel):
    row: int
    field: str
    message: str
    value: Any = None


class ValidationReportResponse(BaseModel):
    valid: bool
    errors: List[ValidationErrorModel]
    warnings: List[ValidationErrorModel]
    valid_count: int
    total_count: int


class ImportResult(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    errors: List[ValidationErrorModel]
    warnings: List[ValidationErrorModel]


class BEDTrack(BaseModel):
    id: int
    geneId: str
    track_name: str
    chrom: str
    interval_start: int
    interval_end: int
    label: Optional[str] = None
    score: Optional[float] = None
    color: Optional[str] = None
    created_at: str
    created_by: str
