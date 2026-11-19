# Scripts

This directory contains utility scripts for data management and database operations.

## Available Scripts

### Data Import Scripts

#### 1. `generate_sge_vcf_from_csv.py`

Regenerates `data/rnu4-2/sge_variants.vcf` from the De Jonghe et al. dataset (`data/rnu4-2/de_jonghe_et_al.csv`), adding `FUNCTION_SCORE` (from `function_score_mean`), computed `DEPLETION_GROUP`, and `EVIDENCE_CODE`.

```bash
uv run python scripts/generate_sge_vcf_from_csv.py
```

---

#### 2. `insert_gene_and_structure.py`

Inserts a specific gene with its RNA secondary structure.

```bash
uv run python scripts/insert_gene_and_structure.py
```

**Usage:** Edit the script to modify gene data before running.

---

#### 3. `insert_clinical_variants.py`

Inserts clinical variant data from external sources.

```bash
uv run python scripts/insert_clinical_variants.py
```

**What it does:**

- Reads clinical variant data (typically from ClinVar or similar sources)
- Validates variant data
- Inserts variants into the database

---

### External Data Scripts

#### `fetch_clinvar.py`

Downloads a ClinVar GRCh38 VCF release and filters it to the genes in the `genes` table.

```bash
# Latest release
uv run python scripts/fetch_clinvar.py

# A specific release (older releases are fetched from ClinVar's archive)
uv run python scripts/fetch_clinvar.py --release clinvar_20261108
```

**What it does:**

- Downloads the release VCF, its `.tbi` index and `.md5` checksum into `data/clinvar/` (git-ignored) and verifies the checksum. A verified copy is reused on re-runs.
- Keeps every ClinVar allele whose position overlaps a gene's coordinates, including variants ClinVar labels with a neighbouring gene (e.g. `SIRT4|RNU4-2`).
- Writes `data/clinvar/<release>_variants.csv`, one row per allele, with the release name, gene, `variant_id` (`chr{CHR}-{POS}-{REF}-{ALT}`) and ClinVar fields (significance, review status, conditions, HGVS, etc.). `scv_accessions` lists the submissions behind each classification, `conflicting_significance` gives the per-classification counts when submitters disagree, and `condition_ids` holds the disease database identifiers (OMIM, MONDO, MedGen).

It does not write to the database. Logic lives in `rnudb_utils/clinvar.py`.

#### `import_clinvar.py`

Imports a CSV written by `fetch_clinvar.py` into the `clinvar_classifications` table.

```bash
uv run python scripts/import_clinvar.py data/clinvar/clinvar_20261108_variants.csv

# Into another database file (e.g. a copy, for a trial run)
uv run python scripts/import_clinvar.py data/clinvar/clinvar_20261108_variants.csv --db /tmp/copy.db
```

**What it does:**

- Stores ClinVar's classification for each variant (one row per variant), tagged with the release, with the significance translated to the app's spelling (e.g. `Uncertain_significance` → `VUS`) and ClinVar's original kept in `raw_significance`.
- Adds a minimal `variants` row (id, position, ref/alt, HGVS, nucleotide position) only for variants not already in the database. Existing variants, curated classifications and literature are never changed.
- A newer release replaces a variant's ClinVar row; an older release never does, and re-importing the same file changes nothing.
- Skips rows whose gene is not in the `genes` table, writes every change to `audit_log` as `clinvar-import`, and commits in one transaction.

The database must be at the latest Alembic migration (`uv run alembic upgrade head`).

---

### Database Setup Scripts

#### 4. `init.py`

Database initialization script.

```bash
uv run python scripts/init.py
```

**What it does:**

- Creates the database schema
- Applies Alembic migrations

**Note:** `init.py` no longer offers a sample-data import step (the `insert_sample_data.py` seeder was removed). Gene/variant data is imported via the web UI (`/curate`) using the data files under `data/`.

---

## Usage

### Running Scripts

All scripts are run via `uv run python`:

```bash
# From project root
uv run python scripts/<script_name>.py
```

### Prerequisites

- Database must exist (`uv run alembic upgrade head`)
- Environment variables must be set (see `.env.example`)
- Required Python packages installed (`uv sync`)

---

## Adding New Scripts

When creating a new script:

1. Place in `scripts/` directory
2. Add shebang: `#!/usr/bin/env python3`
3. Add docstring explaining purpose
4. Use the same import pattern:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from rnudb_utils import ...
```

---

## Notes

- Scripts typically modify the database directly (bypassing the pending changes workflow)
- Use for initial data seeding, not regular curation
- For regular data entry, use the web UI at `/curate`
