# Scripts

This directory contains utility scripts for data management and database operations.

## Available Scripts

### Data Import Scripts

#### 1. `insert_sample_data.py`

Inserts sample gene and variant data into the database for testing and development.

```bash
# Run all sample data inserts
uv run python scripts/insert_sample_data.py
```

**What it inserts:**

- Sample genes (e.g., RNU4-2, RNU1-1, RNU2-1)
- Sample variants with population data
- Sample literature entries

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
- Initializes default data
- Sets up initial configuration

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
