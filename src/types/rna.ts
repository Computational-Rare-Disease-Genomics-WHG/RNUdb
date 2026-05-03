// Core Data Interfaces
export interface SnRNAGene {
  id: string; // Unique identifier (e.g., "RNU4-2")
  name: string; // Gene symbol (e.g., "RNU4-2")
  fullName: string; // Full descriptive name (e.g., "RNA, U4 small nuclear 2")
  chromosome: string; // Chromosome location (e.g., "12")
  start: number; // Genomic start position
  end: number; // Genomic end position
  strand: string; // Strand orientation ("+" or "-")
  sequence: string; // Reference RNA sequence
  description: string; // Functional description
}

export interface Variant {
  id: string; // Unique variant identifier
  geneId: string; // Reference to SnRNAGene.id
  position: number; // Genomic position
  nucleotidePosition?: number; // Position in RNA sequence (1-based)
  ref: string; // Reference allele
  alt: string; // Alternate allele
  hgvs?: string; // HGVS notation

  // Clinical annotation fields (nullable)
  consequence?: string; // Variant consequence type
  clinvar_significance?: string; // ClinVar pathogenicity
  clinical_significance?: string; // Clinical interpretation
  disease_type?: string; // Disease association (e.g., "ReNU Syndrome", "Retinitis Pigmentosa")
  pmid?: string; // PubMed ID for evidence

  // Functional analysis fields (nullable)
  function_score?: number; // Functional impact score
  pvalues?: number; // Statistical p-value
  qvalues?: number; // Adjusted q-value
  depletion_group?: string; // Depletion category ("normal", "moderate", "strong")

  // Population genetics fields (nullable)
  gnomad_ac?: number; // gnomAD allele count
  gnomad_hom?: number; // gnomAD homozygote count
  aou_ac?: number; // All of Us allele count
  aou_hom?: number; // All of Us homozygote count
  ukbb_ac?: number; // UK Biobank allele count
  ukbb_hom?: number; // UK Biobank homozygote count
  cadd_score?: number; // CADD pathogenicity score

  // Biallelic variant fields
  zygosity?: "hom" | "het"; // Zygosity (homozygous/heterozygous)
  cohort?: string; // Study/cohort name
  linkedVariantIds?: string[]; // IDs of linked biallelic variants
}

export interface Literature {
  id: string; // Literature ID (primary key)
  title: string; // Paper title
  authors: string; // Author list as string
  journal: string; // Journal name
  year: string; // Publication year
  doi: string; // Digital Object Identifier
}

export interface LiteratureCounts {
  variant_id: string; // Reference to Variant.id
  literature_id: string; // Reference to Literature.id
  counts: number; // Number of citations/references
}

// RNA Structure Interfaces
export interface Nucleotide {
  id: number; // Nucleotide position ID
  base: "A" | "U" | "G" | "C"; // RNA base
  x: number; // X coordinate for visualization
  y: number; // Y coordinate for visualization
}

export interface BasePair {
  from_pos: number; // First nucleotide position
  to_pos: number; // Second nucleotide position
}

export interface AnnotationLabel {
  id: string; // Annotation ID
  text: string; // Label text
  x: number; // X position
  y: number; // Y position
  font_size: number; // Font size for display
  color?: string; // Optional color override
}

// Structural Features for annotating RNA motifs
export type FeatureType =
  | "k-turn"
  | "hairpin"
  | "loop"
  | "stem"
  | "bulge"
  | "internal-loop"
  | "multi-branch-loop"
  | "custom";

export interface StructuralFeature {
  id: string; // Unique feature ID (e.g., "feature-1234567890")
  feature_type: FeatureType; // Type of structural feature
  nucleotide_ids: number[]; // Array of nucleotide IDs that comprise this feature
  label_text: string; // Label text (e.g., "K-turn I")
  label_x: number; // X position
  label_y: number; // Y position
  label_font_size: number; // Font size for display
  label_color?: string; // Optional color override
  description?: string; // Optional description
  color?: string; // Optional highlight color for the feature
}

export interface RNAStructure {
  id: string; // Unique structure ID
  gene_id: string; // Reference to SnRNAGene.id
  nucleotides: Nucleotide[]; // Nucleotide positions and bases
  base_pairs: BasePair[]; // Base pairing information
  annotations?: AnnotationLabel[]; // Optional structure annotations
  structural_features?: StructuralFeature[]; // Optional structural feature annotations
}

export interface PDBStructure {
  geneId: string; // Reference to SnRNAGene.id
  pdbData: string; // Raw PDB file content as string
}

// Overlay and Track System - Backward compatible
export interface OverlayData {
  [nucleotidePosition: number]: OverlayPoint | number; // Support both old and new formats
}

export interface OverlayPoint {
  value: number; // Numeric value for visualization
  variantId?: string; // Optional link to variant for hover details
  color?: string; // Optional color override
}

export type ColorScalePreset =
  | "red_blue"
  | "green_red"
  | "viridis"
  | "grayscale"
  | "categorical";

export interface TrackConfig {
  id: string; // Unique track identifier
  geneId: string; // Reference to SnRNAGene.id
  name: string; // Display name for track
  type: "bar" | "variant" | "coloured_block"; // Visual representation type
  data: OverlayData; // Track data points
  legend: TrackLegend; // Legend and styling information
}

export interface TrackLegend {
  title: string; // Legend title
  description?: string; // Optional description
  colorScale: ColorScalePreset; // One of 5 preset color schemes
  scaleType: "continuous" | "discrete"; // Data interpretation type
  valueRange: [number, number]; // Min and max values for scaling
}

export interface SGEDataset {
  id: string; // Dataset identifier
  geneId: string; // Reference to SnRNAGene.id
  tracks: SGETrack[]; // Pre-configured SGE tracks
}

export interface SGETrack {
  type: "function_score" | "depletion_group"; // SGE-specific track types
  trackConfig: TrackConfig; // Full track configuration
}

// Legacy support for existing components
export interface RNAData {
  id: string;
  geneId: string;
  name: string;
  nucleotides: Nucleotide[];
  base_pairs: BasePair[];
  canvasWidth?: number;
  canvasHeight?: number;
  annotations?: AnnotationLabel[];
  structural_features?: StructuralFeature[]; // Optional structural feature annotations
}