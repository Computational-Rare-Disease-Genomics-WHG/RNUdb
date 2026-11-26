#!/usr/bin/env python3
"""Import a filtered ClinVar CSV into the clinvar_classifications table.

Reads a CSV written by scripts/fetch_clinvar.py and stores ClinVar's
classification for each variant, tagged with the release. Variants not yet in
the database get a minimal `variants` row; existing variants and curated
classifications are never changed.

Usage:
    uv run python scripts/import_clinvar.py data/clinvar/clinvar_20261108_variants.csv
    uv run python scripts/import_clinvar.py <csv> --db /tmp/copy.db
"""

import argparse
import sys
from dataclasses import asdict
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Ensure the project root is on sys.path so `rnudb_utils` can be imported
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from rnudb_utils import clinvar  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("csv", type=Path, help="CSV from fetch_clinvar.py")
    parser.add_argument(
        "--db",
        type=Path,
        default=REPO_ROOT / "data" / "database.db",
        help="SQLite database to import into (default: data/database.db)",
    )
    args = parser.parse_args()

    if not args.csv.exists():
        print(f"CSV not found: {args.csv}")
        return 1

    engine = create_engine(f"sqlite:///{args.db}")
    with Session(engine) as session:
        summary = clinvar.import_clinvar_csv(session, args.csv)

    print(f"Imported {args.csv.name} into {args.db}")
    for field, count in asdict(summary).items():
        print(f"  {field}: {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
