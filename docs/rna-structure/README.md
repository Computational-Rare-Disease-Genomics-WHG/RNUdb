# RNA Structure Import Format

**Version:** 1.0.0
**Last Updated:** 2026-05-06
**Status:** Active

---

## Overview

This document describes the JSON file format for importing RNA secondary structures into RNUdb via the Structure Import Wizard. The format is designed to be compatible with exports from the RNA Editor.

---

## Quick Example

```json
{
  "id": "rnu4-2-v1",
  "name": "RNU4-2 Secondary Structure",
  "nucleotides": [
    { "id": 1, "base": "G", "x": 100, "y": 50 },
    { "id": 2, "base": "U", "x": 110, "y": 60 }
  ],
  "base_pairs": [{ "from_pos": 1, "to_pos": 10 }]
}
```

---

## Field Reference

### Top-Level Fields

| Field                 | Type   | Required | Description                         |
| --------------------- | ------ | -------- | ----------------------------------- |
| `id`                  | string | Yes      | Unique identifier for the structure |
| `name`                | string | Yes      | Human-readable name                 |
| `nucleotides`         | array  | Yes      | Array of nucleotide objects (min 1) |
| `base_pairs`          | array  | No       | Array of base pair connections      |
| `annotations`         | array  | No       | Array of text annotation objects    |
| `structural_features` | array  | No       | Array of structural feature objects |

---

### Nucleotide Object

| Field  | Type    | Required | Description                                       |
| ------ | ------- | -------- | ------------------------------------------------- |
| `id`   | integer | Yes      | Unique position identifier (positive integer)     |
| `base` | string  | Yes      | Nucleotide base: A, C, G, or U (case-insensitive) |
| `x`    | number  | Yes      | X coordinate for visualization                    |
| `y`    | number  | Yes      | Y coordinate for visualization                    |

**Example:**

```json
{ "id": 1, "base": "G", "x": 100.0, "y": 50.0 }
```

---

### Base Pair Object

| Field      | Type    | Required | Description                                             |
| ---------- | ------- | -------- | ------------------------------------------------------- |
| `from_pos` | integer | Yes      | Starting nucleotide position (references nucleotide id) |
| `to_pos`   | integer | Yes      | Ending nucleotide position (references nucleotide id)   |

**Example:**

```json
{ "from_pos": 1, "to_pos": 10 }
```

---

### Annotation Object

| Field       | Type    | Required | Description                                |
| ----------- | ------- | -------- | ------------------------------------------ |
| `id`        | string  | Yes      | Unique annotation ID                       |
| `text`      | string  | Yes      | Annotation text content                    |
| `x`         | number  | Yes      | X position for the annotation              |
| `y`         | number  | Yes      | Y position for the annotation              |
| `font_size` | integer | Yes      | Font size in pixels                        |
| `color`     | string  | No       | Text color as hex string (e.g., "#000000") |

**Example:**

```json
{
  "id": "ann-1",
  "text": "5' End",
  "x": 95,
  "y": 45,
  "font_size": 12,
  "color": "#000000"
}
```

---

### Structural Feature Object

| Field             | Type    | Required | Description                                                |
| ----------------- | ------- | -------- | ---------------------------------------------------------- |
| `id`              | string  | Yes      | Unique feature ID                                          |
| `feature_type`    | string  | Yes      | Type of feature (e.g., "stem", "loop", "bulge", "hairpin") |
| `nucleotide_ids`  | array   | Yes      | Array of nucleotide position IDs included in this feature  |
| `label_text`      | string  | Yes      | Text label for the feature                                 |
| `label_x`         | number  | Yes      | X position for the label                                   |
| `label_y`         | number  | Yes      | Y position for the label                                   |
| `label_font_size` | integer | Yes      | Font size for the label                                    |
| `label_color`     | string  | No       | Label text color (hex)                                     |
| `description`     | string  | No       | Descriptive text for the feature                           |
| `color`           | string  | No       | Visual color for the feature (hex)                         |

**Example:**

```json
{
  "id": "feat-1",
  "feature_type": "stem",
  "nucleotide_ids": [1, 2, 3, 4],
  "label_text": "Stem 1",
  "label_x": 115,
  "label_y": 55,
  "label_font_size": 11,
  "label_color": "#008000",
  "description": "Primary stem structure",
  "color": "#00FF00"
}
```

---

## Naming Convention

The import supports both **camelCase** and **snake_case** field names. The API automatically converts camelCase to snake_case during import.

| camelCase (Input)    | snake_case (Internal) |
| -------------------- | --------------------- |
| `basePairs`          | `base_pairs`          |
| `structuralFeatures` | `structural_features` |
| `fromPos`            | `from_pos`            |
| `toPos`              | `to_pos`              |
| `chromStart`         | `chrom_start`         |

**Example (camelCase input):**

```json
{
  "id": "example",
  "name": "Test",
  "nucleotides": [...],
  "basePairs": [...],
  "structuralFeatures": [...]
}
```

Both formats are valid and will be processed identically.

---

## Validation Rules

### Errors (Import Blocked)

The import will fail and show errors if any of these conditions are met:

| Condition                   | Error Message                                  |
| --------------------------- | ---------------------------------------------- |
| Missing `id`                | "Structure ID is required"                     |
| Missing `name`              | "Structure name is required"                   |
| Missing `nucleotides`       | "nucleotides must be an array"                 |
| Empty `nucleotides`         | "At least one nucleotide is required"          |
| Invalid nucleotide base     | "Invalid base 'X'. Must be A, C, G, or U"      |
| Non-integer nucleotide ID   | "Nucleotide ID must be an integer"             |
| Non-numeric coordinate      | "Nucleotide coordinate must be a number"       |
| Invalid base pair reference | "Base pair references non-existent nucleotide" |

### Warnings (Import Allowed)

These conditions will generate warnings but will not block the import:

| Condition                  | Warning Message                       |
| -------------------------- | ------------------------------------- |
| No base pairs defined      | "No base pairs defined"               |
| No annotations             | "No annotations included"             |
| No structural features     | "No structural features included"     |
| Base pair to same position | "Base pair connects to same position" |

---

## Examples

See the `examples/` directory for sample JSON files:

| File                    | Description                                   |
| ----------------------- | --------------------------------------------- |
| `minimal.json`          | Minimal valid structure with just nucleotides |
| `with-base-pairs.json`  | Structure with base pair connections          |
| `with-annotations.json` | Structure with text annotations               |
| `full.json`             | Complete structure with all features          |

---

## Related

- **UI Component:** StructureImportWizard (`src/components/Curate/StructureImportWizard.tsx`)
- **API Endpoint:** `/api/imports/structures` and `/api/imports/structures/validate`
- **Validation Service:** `api/services/validation.py` - `validate_structure()` function
- **Database Models:** `api/models.py` - RNAStructure, Nucleotide, BasePair, Annotation, StructuralFeature

---

## Version History

| Version | Date       | Changes               |
| ------- | ---------- | --------------------- |
| 1.0.0   | 2026-05-06 | Initial documentation |

---

## Feedback

If you encounter issues with the import format or find inconsistencies, please [report them on GitHub](https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/issues).
