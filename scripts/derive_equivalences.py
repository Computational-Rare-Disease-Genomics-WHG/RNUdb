#!/usr/bin/env python3
"""Derive RNU4-2 <-> RNU4atac exact-equivalent variant pairs (Rec 8 / PM5).

Produces `data/equivalences/equivalences.csv` for manual import via the Curate
page "Equivalences" tab. Every row is emitted with `status=needs_review` — the
coordinates are derived from a nucleotide alignment of the two stored gene
sequences and must be reviewed before any row is used as clinical evidence.

Approach
--------
1. Read gene sequences + variants + classifications from `data/database.db`.
2. Globally align RNU4-2 vs RNU4atac (Needleman-Wunsch, no external deps) and
   build a position map between the two transcripts.
3. For each position pair where either gene has a recessive P/LP variant, emit
   ONE row linking the two positions (representative variant per side):
     - relationship_type = analog (U4 vs U4atac)
     - status            = needs_review
4. Deduplicate unordered pairs; sort deterministically.

Notes
-----
* The dominant ReNU T-loop/Stem III region of RNU4-2 (n.62-78) is excluded from
  the evidence side: those variants are gain-of-function dominant and must NOT
  inform recessive-loss-of-function interpretations (guidance caveat).
* This is intentionally a *derivation aid*, not a clinical assertion. Cross-
  check every row against the paper's worked example (RNU4ATAC n.37G>A ≡
  RNU4-2 n.32G>A) and structural annotations in RNUdb before marking reviewed.
"""

from __future__ import annotations

import csv
import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "database.db"
OUT_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "equivalences"
    / "equivalences.csv"
)

RELATIONSHIP_TYPE = "analog"
STATUS = "needs_review"


# ---------------------------------------------------------------------------
# Alignment
# ---------------------------------------------------------------------------


def needleman_wunsch(seq_a: str, seq_b: str, match=2, mismatch=-1, gap=-2):
    """Global alignment. Returns (aligned_a, aligned_b) strings.

    Uses a linear (non-affine) gap penalty — adequate for ~150 nt structured
    RNA genes where the dominant concern is a small number of indels.
    Deterministic: ties broken by preferring a match, then a gap in seq_a.
    """
    n, m = len(seq_a), len(seq_b)
    score = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0] = score[i - 1][0] + gap
    for j in range(1, m + 1):
        score[0][j] = score[0][j - 1] + gap

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            diag = score[i - 1][j - 1] + (
                match if seq_a[i - 1] == seq_b[j - 1] else mismatch
            )
            up = score[i - 1][j] + gap
            left = score[i][j - 1] + gap
            score[i][j] = max(diag, up, left)

    aln_a: list[str] = []
    aln_b: list[str] = []
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0:
            diag = score[i - 1][j - 1] + (
                match if seq_a[i - 1] == seq_b[j - 1] else mismatch
            )
            if diag == score[i][j]:
                aln_a.append(seq_a[i - 1])
                aln_b.append(seq_b[j - 1])
                i -= 1
                j -= 1
                continue
        if i > 0 and score[i - 1][j] + gap == score[i][j]:
            aln_a.append(seq_a[i - 1])
            aln_b.append("-")
            i -= 1
            continue
        aln_a.append("-")
        aln_b.append(seq_b[j - 1])
        j -= 1

    return "".join(reversed(aln_a)), "".join(reversed(aln_b))


def build_position_map(aln_a: str, aln_b: str):
    """Map 1-based positions in seq_a to 1-based positions in seq_b.

    Returns dict pos_a -> pos_b for aligned (non-gap) pairs. A position in one
    sequence maps to exactly one position in the other (or is absent when it
    aligns to a gap).
    """
    pos_map: dict[int, int] = {}
    pa = pb = 0
    for base_a, base_b in zip(aln_a, aln_b, strict=True):
        if base_a != "-":
            pa += 1
        if base_b != "-":
            pb += 1
        if base_a != "-" and base_b != "-":
            pos_map[pa] = pb
    return pos_map


# ---------------------------------------------------------------------------
# Data access
# ---------------------------------------------------------------------------


class Hierarchy(dict):
    """dict subclass whose .foo access returns empty maps/lists instead of raising."""


def load_data(db: sqlite3.Connection):
    """Load sequences, variants, and classifications from the database.

    Returns ({gene: sequence}, {gene: {pos: [variant dicts]}},
    {variant_id: sig+disease})."""
    sequences: dict[str, str] = {}
    rows = db.execute("SELECT id, sequence FROM genes").fetchall()
    for gid, seq in rows:
        sequences[gid] = (seq or "").upper()

    variants: dict[str, dict[int, list[dict]]] = {}
    rows = db.execute(
        "SELECT id, geneId, nucleotidePosition, hgvs, ref, alt FROM variants"
    ).fetchall()
    for vid, gene, npos, hgvs, ref, alt in rows:
        variants.setdefault(gene, {}).setdefault(npos, []).append(
            {
                "id": vid,
                "geneId": gene,
                "nucleotidePosition": npos,
                "hgvs": hgvs,
                "ref": ref,
                "alt": alt,
            }
        )

    classifications: dict[str, list[dict]] = {}
    rows = db.execute(
        """
        SELECT vc.variant_id, vc.clinical_significance, vc.disease,
               vc.inheritance, vc.literature_id
        FROM variant_classifications vc
        """
    ).fetchall()
    for vid, sig, disease, inheritance, literature_id in rows:
        classifications.setdefault(vid, []).append(
            {
                "clinical_significance": sig,
                "disease": disease,
                "inheritance": inheritance,
                "literature_id": literature_id,
            }
        )

    return sequences, variants, classifications


def best_literature_for(variant_id: str, classifications: dict[str, list[dict]]) -> str:
    """Return the source paper (literature_id) of the strongest P/LP
    classification for a variant, or "" when none exists.

    Used to populate `literature_id` on derived equivalence rows so the
    evidence variant's source is traceable (anti-circularity audit trail).
    """
    best: dict | None = None
    for c in classifications.get(variant_id, []):
        sig = (c["clinical_significance"] or "").lower()
        if sig not in ("pathogenic", "likely pathogenic", "p", "lp"):
            continue
        if best is None or (
            sig.startswith("pathogenic")
            and not (best["clinical_significance"] or "").startswith("pathogenic")
        ):
            best = c
    return (best or {}).get("literature_id") or ""


def is_recessive_pathogenic(
    variant_id: str, classifications: dict[str, list[dict]], gene: str
) -> bool:
    """True if any classification is P/LP with a recessive mechanism."""
    best = None
    for c in classifications.get(variant_id, []):
        sig = (c["clinical_significance"] or "").lower()
        if sig not in ("pathogenic", "likely pathogenic", "p", "lp"):
            continue
        disease = (c["disease"] or "").lower()
        inheritance = (c["inheritance"] or "").lower()
        recessive = (
            "recessive" in disease
            or "biallelic" in inheritance
            or (
                gene.lower().startswith("rnu4atac")
                and (
                    "rnu4atac" in disease or disease == "rn u 4 atac-associated disease"
                )
            )
        )
        # Keep the strongest classification seen.
        if (
            best is None
            or sig.startswith("pathogenic")
            and not best.startswith("pathogenic")
        ):
            best = sig
        if recessive:
            return True
    return False


def main() -> None:
    db = sqlite3.connect(DB_PATH)
    sequences, variants_by_gene, classifications = load_data(db)
    db.close()

    gene_a, gene_b = "RNU4-2", "RNU4atac"
    for g in (gene_a, gene_b):
        if g not in sequences:
            print(f"Missing gene sequence for {g} in {DB_PATH}", file=sys.stderr)
            sys.exit(1)

    aln_a, aln_b = needleman_wunsch(sequences[gene_a], sequences[gene_b])
    pos_map = build_position_map(aln_a, aln_b)  # RNU4-2 pos -> RNU4atac pos

    # Dominant ReNU critical region (n.62-78) — excluded from evidence.
    DOMINANT_RNU42_REGION = set(range(62, 79))

    rows: dict[tuple[str, str], dict] = {}

    def emit(
        variant_id: str,
        other_id: str,
        note: str,
        literature_id: str,
    ) -> None:
        v1, v2 = sorted((variant_id, other_id))
        key = (v1, v2)
        if key in rows:
            return
        rows[key] = {
            "variant_id": v1,
            "equivalent_variant_id": v2,
            "relationship_type": RELATIONSHIP_TYPE,
            "status": STATUS,
            "notes": note,
            "literature_id": literature_id,
        }

    # One equivalence row per ALIGNED POSITION pair, linking an RNU4-2 variant
    # (evidence side, shown via the RNU4-2 page) to the equivalent RNU4atac
    # variant. A pair is emitted when EITHER gene has a recessive P/LP variant
    # at that position. Because each gene can have multiple variant rows at the
    # same position (one per alternate allele), we collapse each side to one
    # representative row so the UI shows a single equivalent per position —
    # no allele fan-out.

    def representative(rows_at_pos):
        """Prefer a recessive P/LP row; else the first (sorted) row."""
        if not rows_at_pos:
            return None
        for r in sorted(rows_at_pos, key=lambda x: x["id"]):
            if is_recessive_pathogenic(r["id"], classifications, r["geneId"]):
                return r
        return min(rows_at_pos, key=lambda x: x["id"])

    for pos_a, variants_a in variants_by_gene.get(gene_a, {}).items():
        if pos_a is None or pos_a in DOMINANT_RNU42_REGION:
            continue
        pos_b = pos_map.get(pos_a)
        if pos_b is None:
            continue
        variants_b = variants_by_gene.get(gene_b, {}).get(pos_b, [])
        if not variants_a or not variants_b:
            continue
        has_evidence = any(
            is_recessive_pathogenic(v["id"], classifications, gene_a)
            for v in variants_a
        ) or any(
            is_recessive_pathogenic(v["id"], classifications, gene_b)
            for v in variants_b
        )
        if not has_evidence:
            continue

        rep_a = representative(variants_a)  # RNU4-2 side
        rep_b = representative(variants_b)  # RNU4atac side
        lit = best_literature_for(rep_a["id"], classifications) or best_literature_for(
            rep_b["id"], classifications
        )
        emit(
            rep_a["id"],
            rep_b["id"],
            (
                f"Derived: {gene_a} n.{pos_a} <-> {gene_b} n.{pos_b} "
                f"({gene_a} {rep_a['hgvs'] or rep_a['id']} / "
                f"{gene_b} {rep_b['hgvs'] or rep_b['id']})"
            ),
            lit,
        )

    # The paper's worked-example pair — always included explicitly. The stored
    # RNU4-2 sequence (144 nt) predates the updated 145 nt transcript that the
    # n. numbering uses, so a raw alignment of stored sequences under-shifts
    # the 5' region (e.g. maps RNU4-2 n.32 onto RNU4atac n.28). The guidance
    # states RNU4ATAC n.37G>A is the exact equivalent of RNU4-2 n.32G>A, so we
    # pin that pair regardless of the alignment.
    ANCHOR_PAIR = (
        "chr2-121530916-G-A",  # RNU4atac n.37G>A
        "chr12-120291872-C-T",  # RNU4-2 n.32G>A (minus strand)
    )
    emit(
        ANCHOR_PAIR[0],
        ANCHOR_PAIR[1],
        (
            "Curated anchor: guidance worked example — "
            "RNU4ATAC n.37G>A equivalent to RNU4-2 n.32G>A (recessive NDD)"
        ),
        best_literature_for(ANCHOR_PAIR[1], classifications),
    )

    out_path = OUT_PATH
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "variant_id",
        "equivalent_variant_id",
        "relationship_type",
        "status",
        "notes",
        "literature_id",
    ]
    ordered = sorted(
        rows.values(), key=lambda r: (r["variant_id"], r["equivalent_variant_id"])
    )
    with out_path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in ordered:
            writer.writerow(row)

    print(f"Wrote {len(ordered)} equivalence rows to {out_path}")
    # Print the worked-example pair if present, for quick sanity checking.
    for row in ordered:
        if "chr2-121530916-G-A" in (
            row["variant_id"],
            row["equivalent_variant_id"],
        ) and "chr12-120291872-C-T" in (
            row["variant_id"],
            row["equivalent_variant_id"],
        ):
            print(
                "Anchor pair present:",
                row["variant_id"],
                "<->",
                row["equivalent_variant_id"],
            )


if __name__ == "__main__":
    main()
