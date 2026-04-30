from pydantic import BaseModel, Field
from typing import List, Optional


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
