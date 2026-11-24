#!/usr/bin/env python3
"""Regenerate sge_variants.vcf from the De Jonghe et al. dataset (issue #358).

Reads data/rnu4-2/de_jonghe_et_al.csv and writes data/rnu4-2/sge_variants.vcf.

Field mapping (per issue #358 decision):
  - POS / REF / ALT        <- CSV ID (chrom-pos-ref-alt; all rows parse)
  - HGVS                   <- CSV HGVS_transcript (e.g. n.76C>T)
  - NUCLEOTIDE_POSITION    <- CSV nucleotide
  - FUNCTION_SCORE         <- CSV function_score_mean
  - PVALUES / QVALUES      <- CSV pvalues / qvalues
  - CADD_SCORE             <- CSV CADD_score
  - DEPLETION_GROUP        <- computed from function_score_mean
  - EVIDENCE_CODE          <- CSV evidence_code (blank -> field omitted)

Depletion-group cutoffs are derived from data/rnu4-2/rnu4-2_sge.txt:
    < -1.0   -> "strong"
    < -0.39  -> "moderate"
    >= -0.39 -> "normal"
"""

import csv
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "rnu4-2"
CSV_PATH = DATA_DIR / "de_jonghe_et_al.csv"
OUT_PATH = DATA_DIR / "sge_variants.vcf"

_CUTOFF_STRONG = -1.0
_CUTOFF_MODERATE = -0.39


def classify_depletion(score: float | None) -> str:
    """Map a function score to a depletion group using derived cutoffs."""
    if score is None:
        return ""
    if score < _CUTOFF_STRONG:
        return "strong"
    if score < _CUTOFF_MODERATE:
        return "moderate"
    return "normal"


def _fmt(v: str | None) -> str:
    """Return a numeric value formatted for VCF, or '' if blank."""
    if v is None or v == "" or v in (".", "NA"):
        return ""
    return str(v)


def load_csv_rows() -> list[dict]:
    """Load CSV rows, stripping the UTF-8 BOM."""
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing {CSV_PATH}")

    rows = load_csv_rows()
    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    header = [
        "##fileformat=VCFv4.2",
        "##fileDate=20261124",
        "##source=RNUdb_SGE_DeJonghe",
        "##reference=GRCh38",
        '##INFO=<ID=HGVS,Number=1,Type=String,Description="HGVS nomenclature">',
        "##INFO=<ID=NUCLEOTIDE_POSITION,Number=1,Type=Integer,"
        'Description="Position in RNA sequence">',
        "##INFO=<ID=FUNCTION_SCORE,Number=1,Type=Float,"
        'Description="Functional impact score '
        '(De Jonghe et al. 2026 mean)">',
        '##INFO=<ID=PVALUES,Number=1,Type=Float,Description="Statistical p-value">',
        '##INFO=<ID=QVALUES,Number=1,Type=Float,Description="Adjusted q-value">',
        "##INFO=<ID=DEPLETION_GROUP,Number=1,Type=String,"
        'Description="Depletion category (derived cutoffs '
        '< -1.0 strong, < -0.39 moderate)">',
        "##INFO=<ID=CADD_SCORE,Number=1,Type=Float,"
        'Description="CADD pathogenicity score">',
        "##INFO=<ID=EVIDENCE_CODE,Number=1,Type=String,"
        'Description="ACMG functional evidence code from '
        'SGE (De Jonghe et al. 2026)">',
        "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO",
    ]

    _id_re = re.compile(r"^chr(\d+)-(\d+)-([ACGTacgtN]+)-([ACGTacgtN]+)$")

    lines: list[str] = []
    skipped = 0
    n_coded = 0
    for r in rows:
        vid = (r.get("ID") or "").strip()
        m = _id_re.match(vid)
        if not m:
            skipped += 1
            continue
        chrom, pos, ref, alt = m.groups()

        score = r.get("function_score_mean") or r.get("function_score") or ""
        try:
            score_f = float(score) if score not in ("", ".", "NA") else None
        except ValueError:
            score_f = None

        evidence = (r.get("evidence_code") or "").strip()
        if evidence:
            n_coded += 1

        info_parts = []
        hgvs = (r.get("HGVS_transcript") or r.get("HGVS") or "").strip()
        if hgvs:
            info_parts.append(f"HGVS={hgvs}")
        nucleotide = (r.get("nucleotide") or "").strip()
        if nucleotide:
            info_parts.append(f"NUCLEOTIDE_POSITION={nucleotide}")
        fs = _fmt(f"{score_f:.9g}" if score_f is not None else "")
        if fs:
            info_parts.append("FUNCTION_SCORE=" + fs)
        for out_key in ("pvalues", "qvalues"):
            v = _fmt(r.get(out_key) or "")
            if v:
                info_parts.append(out_key.upper() + "=" + v)
        cadd = _fmt(r.get("CADD_score") or "")
        if cadd:
            info_parts.append("CADD_SCORE=" + cadd)
        depletion = classify_depletion(score_f)
        if depletion:
            info_parts.append(f"DEPLETION_GROUP={depletion}")
        if evidence:
            info_parts.append(f"EVIDENCE_CODE={evidence}")

        lines.append(
            f"chr{chrom}\t{pos}\t{vid}\t{ref}\t{alt}\t.\tPASS\t{';'.join(info_parts)}"
        )

    out = "\n".join(header + lines) + "\n"
    OUT_PATH.write_text(out)
    print(f"Wrote {OUT_PATH}")
    print(f"Records: {len(lines)}  (skipped {skipped})")
    print(f"Records carrying EVIDENCE_CODE: {n_coded}")


if __name__ == "__main__":
    main()
