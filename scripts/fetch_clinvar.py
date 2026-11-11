#!/usr/bin/env python3
"""Download a ClinVar GRCh38 release and filter it to the genes in RNUdb.

Writes <out-dir>/<release>_variants.csv with one row per ClinVar allele that
overlaps a gene in the `genes` table, tagged with the release name.

Usage:
    uv run python scripts/fetch_clinvar.py
    uv run python scripts/fetch_clinvar.py --release clinvar_20261108
    uv run python scripts/fetch_clinvar.py --out-dir /tmp/clinvar
"""

import argparse
import sys
from pathlib import Path

# Ensure the project root is on sys.path so `rnudb_utils` can be imported
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from rnudb_utils import clinvar  # noqa: E402
from rnudb_utils.database import get_all_genes  # noqa: E402


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
    args = parser.parse_args()

    genes = get_all_genes()
    if not genes:
        print("No genes in the database; nothing to filter.")
        return 1

    release = args.release or clinvar.latest_release()
    print(f"Release: {release}")

    vcf_path = clinvar.download_release(release, args.out_dir)
    rows = clinvar.filter_clinvar_vcf(vcf_path, genes, release)

    out_path = args.out_dir / f"{release}_variants.csv"
    clinvar.write_csv(rows, out_path)

    for gene in genes:
        count = sum(1 for r in rows if r["gene_id"] == gene["id"])
        print(f"  {gene['id']}: {count} variants")
    print(f"Wrote {len(rows)} rows to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
