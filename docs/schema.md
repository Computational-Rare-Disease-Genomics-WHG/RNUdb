# Database Schema

This document describes the database tables in RNUdb.

## Overview

- **Database**: SQLite
- **ORM**: SQLAlchemy (via SQLModel)
- **Migrations**: Alembic

## Tables

### 1. genes

Stores gene information for snRNA genes.

| Column      | Type    | Constraints | Description                      |
| ----------- | ------- | ----------- | -------------------------------- |
| id          | TEXT    | PRIMARY KEY | Gene identifier (e.g., RNU4-2)   |
| name        | TEXT    | NOT NULL    | Gene name                        |
| fullName    | TEXT    | NOT NULL    | Full gene name                   |
| chromosome  | TEXT    | NOT NULL    | Chromosome number                |
| start       | INTEGER | NOT NULL    | Genomic start position (1-based) |
| end         | INTEGER | NOT NULL    | Genomic end position             |
| strand      | TEXT    | NOT NULL    | Strand (+ or -)                  |
| sequence    | TEXT    | NOT NULL    | DNA sequence                     |
| description | TEXT    | NOT NULL    | Gene description                 |

---

### 2. variants

Stores variant information with clinical and population data.

| Column                | Type    | Constraints | Description                               |
| --------------------- | ------- | ----------- | ----------------------------------------- |
| id                    | TEXT    | PRIMARY KEY | Variant ID (chr{chrom}-{pos}-{ref}-{alt}) |
| geneId                | TEXT    | NOT NULL    | Foreign key to genes.id                   |
| position              | INTEGER | NOT NULL    | Genomic position                          |
| nucleotidePosition    | INTEGER | NULLABLE    | Position in RNA sequence                  |
| ref                   | TEXT    | NOT NULL    | Reference allele                          |
| alt                   | TEXT    | NOT NULL    | Alternate allele                          |
| hgvs                  | TEXT    | NULLABLE    | HGVS notation                             |
| consequence           | TEXT    | NULLABLE    | Variant consequence                       |
| clinvar_significance  | TEXT    | NULLABLE    | ClinVar significance                      |
| clinical_significance | TEXT    | NULLABLE    | Clinical significance (ACMG)              |
| disease_type          | TEXT    | NULLABLE    | Associated disease                        |
| pmid                  | TEXT    | NULLABLE    | PubMed ID                                 |
| function_score        | REAL    | NULLABLE    | Functional score                          |
| pvalues               | REAL    | NULLABLE    | P-value                                   |
| qvalues               | REAL    | NULLABLE    | Q-value (adjusted)                        |
| depletion_group       | TEXT    | NULLABLE    | Depletion group                           |
| gnomad_ac             | INTEGER | NULLABLE    | gnomAD allele count                       |
| gnomad_hom            | INTEGER | NULLABLE    | gnomAD homozygous count                   |
| aou_ac                | INTEGER | NULLABLE    | All of Us allele count                    |
| aou_hom               | INTEGER | NULLABLE    | All of Us homozygous count                |
| ukbb_ac               | INTEGER | NULLABLE    | UK Biobank allele count                   |
| ukbb_hom              | INTEGER | NULLABLE    | UK Biobank homozygous count               |
| cadd_score            | REAL    | NULLABLE    | CADD score (1-100)                        |
| zygosity              | TEXT    | NULLABLE    | Zygosity type                             |
| cohort                | TEXT    | NULLABLE    | Cohort name                               |

---

### 3. literature

Stores publication information.

| Column  | Type | Constraints | Description       |
| ------- | ---- | ----------- | ----------------- |
| id      | TEXT | PRIMARY KEY | Literature ID     |
| title   | TEXT | NOT NULL    | Publication title |
| authors | TEXT | NOT NULL    | Author list       |
| journal | TEXT | NOT NULL    | Journal name      |
| year    | TEXT | NOT NULL    | Publication year  |
| doi     | TEXT | NOT NULL    | DOI               |

---

### 4. literature_counts

Links variants to literature with citation counts.

| Column        | Type    | Constraints | Description                  |
| ------------- | ------- | ----------- | ---------------------------- |
| variant_id    | TEXT    | PRIMARY KEY | Foreign key to variants.id   |
| literature_id | TEXT    | PRIMARY KEY | Foreign key to literature.id |
| counts        | INTEGER | NOT NULL    | Citation count               |

---

### 5. rna_structures

Stores RNA secondary structure metadata.

| Column | Type | Constraints | Description             |
| ------ | ---- | ----------- | ----------------------- |
| id     | TEXT | PRIMARY KEY | Structure ID            |
| geneId | TEXT | NOT NULL    | Foreign key to genes.id |

---

### 6. nucleotides

Stores nucleotide positions for RNA structures.

| Column       | Type    | Constraints | Description                      |
| ------------ | ------- | ----------- | -------------------------------- |
| id           | INTEGER | PRIMARY KEY | Nucleotide position in structure |
| structure_id | TEXT    | PRIMARY KEY | Foreign key to rna_structures.id |
| base         | TEXT    | NOT NULL    | Nucleotide base (A, G, C, T, U)  |
| x            | REAL    | NOT NULL    | X coordinate for visualization   |
| y            | REAL    | NOT NULL    | Y coordinate for visualization   |

---

### 7. base_pairs

Stores base pair information for RNA structures.

| Column       | Type    | Constraints | Description                      |
| ------------ | ------- | ----------- | -------------------------------- |
| structure_id | TEXT    | PRIMARY KEY | Foreign key to rna_structures.id |
| from_pos     | INTEGER | PRIMARY KEY | Start nucleotide position        |
| to_pos       | INTEGER | PRIMARY KEY | End nucleotide position          |

---

### 8. annotations

Stores text annotations on RNA structures.

| Column       | Type    | Constraints | Description                      |
| ------------ | ------- | ----------- | -------------------------------- |
| id           | TEXT    | PRIMARY KEY | Annotation ID                    |
| structure_id | TEXT    | PRIMARY KEY | Foreign key to rna_structures.id |
| text         | TEXT    | NOT NULL    | Annotation text                  |
| x            | REAL    | NOT NULL    | X position                       |
| y            | REAL    | NOT NULL    | Y position                       |
| font_size    | INTEGER | NOT NULL    | Font size                        |
| color        | TEXT    | NULLABLE    | Text color                       |

---

### 9. structural_features

Stores structural feature annotations.

| Column          | Type    | Constraints | Description                        |
| --------------- | ------- | ----------- | ---------------------------------- |
| id              | TEXT    | PRIMARY KEY | Feature ID                         |
| structure_id    | TEXT    | PRIMARY KEY | Foreign key to rna_structures.id   |
| feature_type    | TEXT    | NOT NULL    | Type of feature                    |
| nucleotide_ids  | TEXT    | NOT NULL    | JSON array of nucleotide positions |
| label_text      | TEXT    | NOT NULL    | Label text                         |
| label_x         | REAL    | NOT NULL    | Label X position                   |
| label_y         | REAL    | NOT NULL    | Label Y position                   |
| label_font_size | INTEGER | NOT NULL    | Label font size                    |
| label_color     | TEXT    | NULLABLE    | Label color                        |
| description     | TEXT    | NULLABLE    | Feature description                |
| color           | TEXT    | NULLABLE    | Feature color                      |

---

### 10. variant_links

Stores biallelic variant relationships.

| Column       | Type | Constraints | Description       |
| ------------ | ---- | ----------- | ----------------- |
| variant_id_1 | TEXT | PRIMARY KEY | First variant ID  |
| variant_id_2 | TEXT | PRIMARY KEY | Second variant ID |

Constraint: `variant_id_1 < variant_id_2` (prevents duplicates)

---

### 11. users

Stores user information and roles.

| Column       | Type     | Constraints | Description                |
| ------------ | -------- | ----------- | -------------------------- |
| github_login | TEXT     | PRIMARY KEY | GitHub username            |
| name         | TEXT     | NULLABLE    | Display name               |
| email        | TEXT     | NULLABLE    | Email address              |
| avatar_url   | TEXT     | NULLABLE    | GitHub avatar URL          |
| role         | TEXT     | NOT NULL    | User role                  |
| created_at   | DATETIME | NULLABLE    | Account creation timestamp |
| updated_at   | DATETIME | NULLABLE    | Last update timestamp      |

**Role Constraint**: Must be one of: `guest`, `pending`, `curator`, `admin`

---

### 12. audit_log

Tracks all database changes for audit purposes.

| Column     | Type     | Constraints        | Description                          |
| ---------- | -------- | ------------------ | ------------------------------------ |
| id         | INTEGER  | PRIMARY KEY (auto) | Audit entry ID                       |
| table_name | TEXT     | NOT NULL           | Name of modified table               |
| record_id  | TEXT     | NULLABLE           | ID of modified record                |
| action     | TEXT     | NOT NULL           | Action type (CREATE, UPDATE, DELETE) |
| old_values | JSON     | NULLABLE           | Previous values (JSON)               |
| new_values | JSON     | NULLABLE           | New values (JSON)                    |
| user_login | TEXT     | NOT NULL           | User who made the change             |
| timestamp  | DATETIME | NULLABLE           | When the change occurred             |

**Action Constraint**: Must be one of: `CREATE`, `UPDATE`, `DELETE`

---

### 13. bed_tracks

Stores BED annotation tracks for genomic visualization.

| Column         | Type     | Constraints        | Description             |
| -------------- | -------- | ------------------ | ----------------------- |
| id             | INTEGER  | PRIMARY KEY (auto) | Track ID                |
| geneId         | TEXT     | NOT NULL           | Foreign key to genes.id |
| track_name     | TEXT     | NOT NULL           | Track name              |
| chrom          | TEXT     | NOT NULL           | Chromosome              |
| interval_start | INTEGER  | NOT NULL           | Start position          |
| interval_end   | INTEGER  | NOT NULL           | End position            |
| label          | TEXT     | NULLABLE           | Track label             |
| score          | REAL     | NULLABLE           | Score value             |
| color          | TEXT     | NULLABLE           | Track color             |
| created_at     | DATETIME | NULLABLE           | Creation timestamp      |
| created_by     | TEXT     | NOT NULL           | GitHub login of creator |

---

### 14. pending_changes

Stores curator changes awaiting admin approval.

| Column       | Type     | Constraints        | Description                                   |
| ------------ | -------- | ------------------ | --------------------------------------------- |
| id           | INTEGER  | PRIMARY KEY (auto) | Change ID                                     |
| entity_type  | TEXT     | NOT NULL           | Type of entity                                |
| entity_id    | TEXT     | NULLABLE           | ID of entity being changed                    |
| gene_id      | TEXT     | NOT NULL           | Associated gene                               |
| action       | TEXT     | NOT NULL           | Action (create, update, delete)               |
| payload      | JSON     | NOT NULL           | Change data (JSON)                            |
| requested_by | TEXT     | NOT NULL           | GitHub login of requester                     |
| requested_at | DATETIME | NULLABLE           | Request timestamp                             |
| status       | TEXT     | NOT NULL           | Status (pending, approved, rejected, applied) |
| reviewed_by  | TEXT     | NULLABLE           | GitHub login of reviewer                      |
| reviewed_at  | DATETIME | NULLABLE           | Review timestamp                              |
| review_notes | TEXT     | NULLABLE           | Review comments                               |
| applied_at   | DATETIME | NULLABLE           | Timestamp when change was applied             |

**Constraints:**

- `entity_type`: gene, variant, literature, structure, bed_track
- `action`: create, update, delete
- `status`: pending, approved, rejected, applied

---

## Entity Relationships

```
genes
  ├── variants (one-to-many)
  ├── literature (one-to-many via variant_literature)
  ├── rna_structures (one-to-many)
  │   ├── nucleotides (one-to-many)
  │   ├── base_pairs (one-to-many)
  │   ├── annotations (one-to-many)
  │   └── structural_features (one-to-many)
  └── bed_tracks (one-to-many)

variant_links (self-referential via variants)
literature_counts (variant ↔ literature many-to-many)

users → pending_changes (one-to-many)
users → audit_log (one-to-many)
users → bed_tracks (created_by)
```

---

## API Endpoints

For interactive API documentation, visit: `/api-docs` (when running locally) or https://rnudb.rarediseasegenomics.org/api-docs

### Public Endpoints

| Endpoint                               | Methods | Description                 |
| -------------------------------------- | ------- | --------------------------- |
| `/api/genes`                           | GET     | List all genes              |
| `/api/genes/{geneId}`                  | GET     | Get gene details            |
| `/api/genes/{geneId}/variants`         | GET     | Get variants for gene       |
| `/api/genes/{geneId}/structure`        | GET     | Get RNA structure           |
| `/api/genes/{geneId}/bed-tracks`       | GET     | Get BED tracks              |
| `/api/genes/{geneId}/literature`       | GET     | Get literature              |
| `/api/genes/{geneId}/pdb`              | GET     | Get PDB data                |
| `/api/variants`                        | GET     | List all variants           |
| `/api/variants/{variantId}`            | GET     | Get variant details         |
| `/api/variants/disease-types`          | GET     | List disease types          |
| `/api/variants/clinical-significances` | GET     | List clinical significances |
| `/api/literature`                      | GET     | List literature             |
| `/api/literature/{literatureId}`       | GET     | Get literature details      |
| `/api/literature-counts`               | GET     | Get literature counts       |
| `/api/bed-tracks`                      | GET     | List all BED tracks         |

### Authenticated Endpoints

| Endpoint              | Methods   | Roles          | Description            |
| --------------------- | --------- | -------------- | ---------------------- |
| `/api/auth/me`        | GET       | All            | Get current user       |
| `/api/curate`         | GET, POST | Curator, Admin | Curate data            |
| `/api/approvals`      | GET       | Admin          | List pending approvals |
| `/api/approvals/{id}` | POST      | Admin          | Approve/reject         |
| `/api/users`          | GET, POST | Admin          | Manage users           |
| `/api/import/*`       | POST      | Curator, Admin | Batch imports          |

---

## Notes

- All timestamps are in UTC
- JSON fields store structured data
- The database uses SQLite which is file-based (stored at `data/database.db`)
- Migrations are managed via Alembic (see `alembic/versions/`)
