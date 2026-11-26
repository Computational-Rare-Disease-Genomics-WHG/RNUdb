#!/usr/bin/env python3
"""Fetch a ClinVar release and import it into the database in one run.

Does what scripts/fetch_clinvar.py and scripts/import_clinvar.py do, in that
order, using the genes in the target database. The CSV is kept in --out-dir.

Usage:
    uv run python scripts/sync_clinvar.py
    uv run python scripts/sync_clinvar.py --release clinvar_20261108
    uv run python scripts/sync_clinvar.py --db /tmp/copy.db
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
    parser.add_argument(
        "--release",
        help="ClinVar release, e.g. clinvar_20261108 (default: latest)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=REPO_ROOT / "data" / "clinvar",
        help="Where to store the download and CSV (default: data/clinvar)",
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=REPO_ROOT / "data" / "database.db",
        help="SQLite database to import into (default: data/database.db)",
    )
    args = parser.parse_args()

    if not args.db.exists():
        print(f"Database not found: {args.db}")
        return 1

    release = args.release or clinvar.latest_release()
    print(f"Release: {release}")

    engine = create_engine(f"sqlite:///{args.db}")
    with Session(engine) as session:
        csv_path, summary = clinvar.sync_release(session, release, args.out_dir)

    print(f"Wrote {csv_path} and imported it into {args.db}")
    for field, count in asdict(summary).items():
        print(f"  {field}: {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
