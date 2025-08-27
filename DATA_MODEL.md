# RNUdb Data Model Specification

## Core Data Interfaces

### SnRNAGene

The primary entity representing a small nuclear RNA gene.

```typescript
interface SnRNAGene {
  id: string;           // Unique identifier (e.g., "RNU4-2")
  name: string;         // Gene symbol (e.g., "RNU4-2") 
  fullName: string;     // Full descriptive name (e.g., "RNA, U4 small nuclear 2")
  chromosome: string;   // Chromosome location (e.g., "12")
  start: number;        // Genomic start position (e.g., 6648956)
  end: number;          // Genomic end position (e.g., 6649101)
  sequence: string;     // Reference RNA sequence
  description: string;  // Functional description
}
```

**Example:**

```typescript

const rnu4_2: SnRNAGene = {
  id: "RNU4-2",
  name: "RNU4-2", 
  fullName: "RNA, U4 small nuclear 2",
  chromosome: "12",
  start: 6648956,
  end: 6649101,
  sequence: "AUACUUACCUGAUUAGGUAGUGCAUUUCGUUCUAGACCUGAA...",
  description: "U4 small nuclear RNA involved in pre-mRNA splicing as part of the spliceosome complex"
};

```

### Variant

Unified variant interface supporting clinical, population, and functional data.

```typescript

interface Variant {
  id: string;                    // Unique variant identifier
  geneId: string;               // Reference to SnRNAGene.id
  position: number;             // Genomic position
  nucleotidePosition?: number;  // Position in RNA sequence (1-based)
  ref: string;                  // Reference allele
  alt: string;                  // Alternate allele
  hgvs?: string;               // HGVS notation
  
  // Clinical annotation fields (nullable)
  consequence?: string;         // Variant consequence type
  clinvar_significance?: string;// ClinVar pathogenicity
  clinical_significance?: string; // Clinical interpretation
  pmid?: string;               // PubMed ID for evidence
  
  
  // Functional analysis fields (nullable) - i.e idk perhaps just for functional
  function_score?: number;     // Functional impact score
  pvalues?: number;           // Statistical p-value
  qvalues?: number;           // Adjusted q-value  
  depletion_group?: string;   // Depletion category ("normal", "moderate", "strong")

  // Population genetics fields (nullable)
  gnomad_ac?: number;   // gnomAD allele frequency
  gnomad_hom?: number; 
  aou_ac?: number;            // All of Us allele count
  aou_hom?: number;           // All of Us homozygote count
  ukbb_ac?: number;           // UK Biobank allele count
  ukbb_hom?: number;          // UK Biobank homozygote count
  cadd_score?: number;        // CADD pathogenicity score
}

```

**Examples:**

```typescript

// Clinical variant
const clinicalVariant: Variant = {
  id: "rs1234567",
  geneId: "RNU4-2", 
  position: 6649001,
  nucleotidePosition: 45,
  ref: "A",
  alt: "G",
  hgvs: "n.45A>G",
  consequence: "structural_variant",
  clinvar_significance: "Pathogenic", 
  clinical_significance: "Pathogenic",
  pmid: "12345678",
  gnomad_ac: 15,
  gnomad_hom: 0
};

// SGE functional variant  
const sgeVariant: Variant = {
  id: "chr12-120291903-T-G",
  geneId: "RNU4-2",
  position: 120291903, 
  nucleotidePosition: 1,
  ref: "T",
  alt: "G", 
  hgvs: "n.1A>C",
  function_score: -0.039657537,
  pvalues: 0.479592176,
  qvalues: 0.70317164,
  depletion_group: "normal",
  aou_ac: 3,
  aou_hom: 0,
  ukbb_ac: 11, 
  ukbb_hom: 0,
  cadd_score: 16.57
};
```

### Literature

Research papers associated with genes.

```typescript
interface Literature {
  pmid: string;          // PubMed ID (primary key)
  title: string;         // Paper title
  authors: string;       // Author list as string
  journal: string;       // Journal name
  year: string;          // Publication year
  doi?: string;          // Digital Object Identifier
  abstract: string;      // Paper abstract
  associatedGenes: string[]; // Array of gene IDs this paper relates to
}
```

**Example:**
```typescript
const paper: Literature = {
  pmid: "12345678",
  title: "Structural analysis of U4 snRNA and its role in pre-mRNA splicing",
  authors: "Smith, J. et al.",
  journal: "Nature Structural Biology", 
  year: "2023",
  doi: "10.1038/nsb.2023.001",
  abstract: "Comprehensive structural analysis of U4 snRNA reveals critical base-pairing interactions...",
  associatedGenes: ["RNU4-2", "RNU4-1"]
};
```

### RNAStructure

Secondary structure information from RNA structure editors.

```typescript

interface RNAStructure {
  id: string;                    // Unique structure ID
  geneId: string;               // Reference to SnRNAGene.id
  nucleotides: Nucleotide[];    // Nucleotide positions and bases
  basePairs: BasePair[];        // Base pairing information
  annotations?: AnnotationLabel[]; // Optional structure annotations
}

interface Nucleotide {
  id: number;           // Nucleotide position ID
  base: 'A' | 'U' | 'G' | 'C'; // RNA base
  x: number;           // X coordinate for visualization
  y: number;           // Y coordinate for visualization
}

interface BasePair {
  from: number;        // First nucleotide position
  to: number;          // Second nucleotide position
}

interface AnnotationLabel {
  id: string;          // Annotation ID
  text: string;        // Label text
  x: number;           // X position
  y: number;           // Y position  
  fontSize: number;    // Font size for display
  color?: string;      // Optional color override
}

```

## Overlay and Track System

### OverlayData

Maps nucleotide positions to values for visualization overlays.

```typescript

interface OverlayData {
  [nucleotidePosition: number]: OverlayPoint;
}

interface OverlayPoint {
  value: number;        // Numeric value for visualization
  variantId?: string;   // Optional link to variant for hover details
  color?: string;       // Optional color override
}
```

**Example:**

```typescript

const functionScoreOverlay: OverlayData = {
  1: { value: -0.5, variantId: "chr12-120291903-T-G" },
  10: { value: 0.8, variantId: "rs1234567" },
  25: { value: 0.0 },  // No associated variant
  45: { value: -0.2, variantId: "rs7890123", color: "#FF0000" } // Custom color
};

```

### TrackConfig

Configuration for visual tracks in the genome browser and RNA viewer.

```typescript
type ColorScalePreset = 'red_blue' | 'green_red' | 'viridis' | 'grayscale' | 'categorical';

interface TrackConfig {
  id: string;              // Unique track identifier
  geneId: string;          // Reference to SnRNAGene.id
  name: string;            // Display name for track
  type: 'bar' | 'variant' | 'coloured_block'; // Visual representation type
  data: OverlayData;       // Track data points
  legend: TrackLegend;     // Legend and styling information
}

interface TrackLegend {
  title: string;                    // Legend title
  description?: string;             // Optional description
  colorScale: ColorScalePreset;     // One of 5 preset color schemes
  scaleType: 'continuous' | 'discrete'; // Data interpretation type
  valueRange: [number, number];     // Min and max values for scaling
}
```

**Color Scale Presets:**
- `red_blue`: Blue (negative) → White (zero) → Red (positive)
- `green_red`: Green (good/low) → Red (bad/high)
- `viridis`: Purple → Blue → Green → Yellow (perceptually uniform)
- `grayscale`: White → Black
- `categorical`: Distinct colors for discrete categories

**Examples:**

```typescript
// Continuous function score track
const functionScoreTrack: TrackConfig = {
  id: "function_score_rnu4-2",
  geneId: "RNU4-2",
  name: "Function Score", 
  type: "bar",
  data: {
    1: { value: -0.5, variantId: "chr12-120291903-T-G" },
    25: { value: 0.8, variantId: "rs1234567" },
    50: { value: 0.0 }
  },
  legend: {
    title: "Function Score",
    description: "SGE depletion scores measuring functional impact", 
    colorScale: "red_blue",
    scaleType: "continuous",
    valueRange: [-1, 1]
  }
};

// Discrete depletion group track
const depletionTrack: TrackConfig = {
  id: "depletion_rnu4-2",
  geneId: "RNU4-2", 
  name: "Depletion Group",
  type: "coloured_block",
  data: {
    10: { value: 3, variantId: "chr12-120291912-C-A" },
    20: { value: 1, variantId: "chr12-120291922-G-T" },
    30: { value: 2, variantId: "chr12-120291932-A-C" }
  },
  legend: {
    title: "Depletion Strength",
    description: "Strength of depletion effect",
    colorScale: "categorical", 
    scaleType: "discrete",
    valueRange: [1, 3]  // 1=normal, 2=moderate, 3=strong
  }
};

// Variant marker track
const variantTrack: TrackConfig = {
  id: "clinvar_rnu4-2",
  geneId: "RNU4-2",
  name: "ClinVar Variants", 
  type: "variant",
  data: {
    45: { value: 1, variantId: "rs1234567" },  // 1=pathogenic
    67: { value: 0.5, variantId: "rs2345678" }, // 0.5=VUS
    89: { value: 0, variantId: "rs3456789" }   // 0=benign
  },
  legend: {
    title: "Clinical Significance",
    colorScale: "green_red",
    scaleType: "discrete", 
    valueRange: [0, 1]
  }
};
```

### SGEDataset

Optional dataset for genes with SGE (Saturation Genome Editing) data.

```typescript
interface SGEDataset {
  id: string;           // Dataset identifier
  geneId: string;       // Reference to SnRNAGene.id
  tracks: SGETrack[];   // Pre-configured SGE tracks
}

interface SGETrack {
  type: 'function_score' | 'depletion_group'; // SGE-specific track types
  trackConfig: TrackConfig;                   // Full track configuration
}
```

**Example:**

```typescript

const rnu4_2_sge: SGEDataset = {
  id: "sge_rnu4-2",
  geneId: "RNU4-2",
  tracks: [
    {
      type: "function_score",
      trackConfig: functionScoreTrack  // From example above
    },
    {
      type: "depletion_group", 
      trackConfig: depletionTrack     // From example above
    }
  ]
};
```

## Data Organization

### File Structure

```

src/data/
├── genes/              # SnRNAGene data
│   ├── rnu1-1.ts      # RNU1-1 gene data
│   ├── rnu2-1.ts      # RNU2-1 gene data
│   ├── rnu4-2.ts      # RNU4-2 gene data
│   └── index.ts       # Export all genes
├── variants/           # Variant data by gene
│   ├── rnu1-1/        
│   │   ├── clinical.ts # Clinical variants
│   │   ├── gnomad.ts  # gnomAD variants
│   │   └── index.ts
│   ├── rnu2-1/
│   ├── rnu4-2/
│   └── index.ts
├── literature/         # Research papers
│   ├── papers.ts      # All literature data
│   └── index.ts
├── structures/         # RNA structure data
│   ├── rnu1-1.ts      # RNU1-1 structure
│   ├── rnu2-1.ts      # RNU2-1 structure  
│   ├── rnu4-2.ts      # RNU4-2 structure
│   └── index.ts
├── sge/               # SGE datasets (optional)
│   ├── rnu4-2.ts      # RNU4-2 SGE data
│   └── index.ts
└── tracks/            # Pre-computed track data
    ├── conservation.ts # Conservation tracks
    ├── regulatory.ts   # Regulatory element tracks
    └── index.ts
```

### Usage Patterns

```typescript
// Get all data for a gene
import { getGene } from '@/data/genes';
import { getVariants } from '@/data/variants';
import { getLiterature } from '@/data/literature';
import { getStructure } from '@/data/structures';
import { getSGEDataset } from '@/data/sge';

const gene = getGene('RNU4-2');
const variants = getVariants('RNU4-2');
const papers = getLiterature('RNU4-2');  
const structure = getStructure('RNU4-2');
const sgeData = getSGEDataset('RNU4-2'); // May return undefined

// Create overlay from variant data
const createFunctionScoreOverlay = (variants: Variant[]): OverlayData => {
  const overlay: OverlayData = {};
  
  variants.forEach(variant => {
    if (variant.nucleotidePosition && variant.function_score !== undefined) {
      overlay[variant.nucleotidePosition] = {
        value: variant.function_score,
        variantId: variant.id
      };
    }
  });
  
  return overlay;
};

// Use in component
const overlayData = createFunctionScoreOverlay(variants);
```

