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
