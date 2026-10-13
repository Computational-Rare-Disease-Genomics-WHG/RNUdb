---
name: curation
description: Convert TSV variant data into web UI import files (VCF + CSV)
---

# Curation

Convert individual-level TSV variant data into the three files needed for web UI import.

## Prerequisites

You need these from the user:
- **Gene parameters**: chromosome, start, end, strand, sequence
- **TSV file(s)**: one or more tab-separated files with variant data per individual

## Output Files

| File | Import Wizard | Purpose |
|------|--------------|---------|
| `literature.csv` | LiteratureImportWizard | Paper references |
| `variants.vcf` | VariantImportWizard | Unique variant records |
| `variant_classifications.csv` | VariantAssociationImportWizard | Per-paper classifications |

## File Formats

### literature.csv

| Column | Required | Notes |
|--------|----------|-------|
| `doi` | Yes | Used as the literature ID |
| `title` | Yes | |
| `authors` | Yes | e.g. "Jackson et al." |
| `journal` | Yes | |
| `year` | Yes | 4-digit |
| `pmid` | No | |
| `url` | No | |

### variants.vcf

Standard VCFv4.2 with INFO fields:

```
##INFO=<ID=HGVS,Number=1,Type=String,Description="HGVS nomenclature">
##INFO=<ID=NUCLEOTIDE_POSITION,Number=1,Type=Integer,Description="Position in RNA sequence">
```

- **ID**: `chr{CHR}-{POS}-{REF}-{ALT}` — add `chr` prefix if missing from TSV
- **INFO HGVS**: `n.XY` notation from the TSV's `variant_cdna` column
- **INFO NUCLEOTIDE_POSITION**: RNA position number

### variant_classifications.csv

| Column | Required | Notes |
|--------|----------|-------|
| `variant_id` | Yes | `chr{CHR}-{POS}-{REF}-{ALT}` |
| `literature_id` | Yes | DOI of the paper |
| `clinical_significance` | No | Pathogenic, Likely Pathogenic, VUS, Likely Benign, Benign |
| `zygosity` | No | Heterozygous, Homozygous, Compound Heterozygous |
| `inheritance` | No | Dominant, Biallelic |
| `disease` | No | Free text |
| `counts` | No | Number of individuals |
| `linked_variant_ids` | No | Comma-separated partner variant IDs |

## Workflow

### 1. Parse TSVs

Each TSV has one row per individual per variant. Common columns:
- `study` — paper identifier (maps to a literature entry)
- `individual_id` — unique person ID
- `variant_cdna` — HGVS notation like `n.4G>A`
- `variant_id` — genomic ID like `11-62841806-C-T` (may be missing for complex events)
- `acmg_classification` — P, LP, VUS, or empty
- `zygosity` — homozygous, compound_het (recessive TSVs)
- `inheritance` — de novo, paternal, maternal (dominant TSVs)
- `disease_mode` — dominant, recessive

### 2. Deduplicate to Unique Variants

Group by `variant_cdna` (HGVS). For each unique variant:
- Use the `variant_id` from the TSV, add `chr` prefix if missing
- Derive `pos`, `ref`, `alt` from the variant_id
- Compute `nucleotidePosition` from the HGVS notation
- Skip variants with empty `variant_id` (complex events outside gene boundaries)

### 3. Compute Genomic Coordinates

On the **reverse strand**: `genomic_pos = gene_end - (nucleotide_position - 1)`
On the **forward strand**: `genomic_pos = gene_start + (nucleotide_position - 1)`

### 4. Build classifications

For each unique variant, per study:
- Count individuals → `counts`
- Use `acmg_classification` → map codes: P→Pathogenic, LP→Likely Pathogenic, VUS→VUS
- Map `zygosity`: homozygous→Homozygous, compound_het→Compound Heterozygous
- Map `disease_mode`: dominant→Dominant, recessive→Biallelic
- Build `linked_variant_ids` for compound het pairs (same individual, different variants)

### 5. ACMG Code Mapping

| TSV Code | CSV Value |
|----------|-----------|
| `P` | Pathogenic |
| `LP` | Likely Pathogenic |
| `VUS` | VUS |
| empty | (leave empty) |

### 6. Compound Het Linking

For recessive variants where two alleles exist in the same individual:
- Both variants share the same `individual_id` and `family_id`
- Each variant's partner goes in the `linked_variant_ids` column (comma-separated if multiple partners)
- Links are stored on both ends

## Example: RNU2-2 Parameters

When applying this skill, the user may provide:
- Chromosome: `chr11`
- Gene start: 62841619
- Gene end: 62841809
- Strand: `-`
- Sequence: 191-base RNA sequence
