"""Position-mapping and counterpart-generation logic for equivalent variants.

Two snRNA genes (e.g. RNU4-2 and RNU4atac) share manually curated position
pairs in the `equivalent_positions` table. A variant at a mapped position has
a "counterpart" variant at the equivalent position in the other gene. This
module resolves position → counterpart and auto-creates counterpart rows when
they don't exist (bijective coverage).
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

_RNA_BASES = frozenset({"A", "C", "G", "U"})


def transcript_base(db: Session, gene_id: str, position: int) -> str | None:
    """Return the RNA base at *position* in the stored 2D structure for
    *gene_id*. Returns None when no structure is loaded or the position is
    out of range. The structure's ``nucleotides`` table is the canonical
    source of transcript bases; ``genes.sequence`` is genomic and may be on
    the opposite strand."""
    row = db.execute(
        text(
            "SELECT upper(substr(n.base, 1, 1)) AS b "
            "FROM nucleotides n "
            "JOIN rna_structures s ON s.id = n.structure_id "
            "WHERE s.geneId = :g AND n.id = :p"
        ),
        {"g": gene_id, "p": position},
    ).fetchone()
    return row._mapping["b"] if row else None


def normalize_gene_order(
    gene_a: str, pos_a: int, gene_b: str, pos_b: int
) -> tuple[str, int, str, int]:
    """Sort the pair so ``gene_a < gene_b`` (consistent with PK ordering)."""
    if gene_a < gene_b:
        return gene_a, pos_a, gene_b, pos_b
    return gene_b, pos_b, gene_a, pos_a


def validate_position_pair(
    db: Session,
    gene_a: str,
    pos_a: int,
    gene_b: str,
    pos_b: int,
) -> str | None:
    """Return an error message if the pair is invalid, or None if valid."""
    if gene_a == gene_b:
        return "Cannot map a gene to itself"
    if pos_a < 1 or pos_b < 1:
        return "Positions must be >= 1"
    base_a = transcript_base(db, gene_a, pos_a)
    base_b = transcript_base(db, gene_b, pos_b)
    if base_a is None:
        return f"Position {gene_a} n.{pos_a} not found in RNA structure"
    if base_b is None:
        return f"Position {gene_b} n.{pos_b} not found in RNA structure"
    if base_a not in _RNA_BASES or base_b not in _RNA_BASES:
        return f"Invalid base: {base_a}/{base_b}"
    if base_a != base_b:
        return (
            f"Base mismatch: {gene_a} n.{pos_a}={base_a} ≠ {gene_b} n.{pos_b}={base_b}"
        )
    ordered = db.execute(
        text(
            "SELECT 1 FROM equivalent_positions "
            "WHERE (gene_a=:ga AND pos_a=:pa) OR (gene_b=:gb AND pos_b=:pb)"
        ),
        {"ga": gene_a, "pa": pos_a, "gb": gene_b, "pb": pos_b},
    ).fetchone()
    if ordered:
        return f"{gene_a} n.{pos_a} or {gene_b} n.{pos_b} is already mapped"
    return None


def find_counterpart(
    db: Session, gene_id: str, position: int
) -> tuple[str, int] | None:
    """Return the counterpart position if *position* is mapped, else None."""
    row = db.execute(
        text(
            "SELECT gene_a, pos_a, gene_b, pos_b "
            "FROM equivalent_positions "
            "WHERE (gene_a=:g AND pos_a=:p) OR (gene_b=:g AND pos_b=:p)"
        ),
        {"g": gene_id, "p": position},
    ).fetchone()
    if not row:
        return None
    m = dict(row._mapping)
    if m["gene_a"] == gene_id:
        return m["gene_b"], m["pos_b"]
    return m["gene_a"], m["pos_a"]


_COMPLEMENT = str.maketrans("ACGTacgt", "TGCAtgca")


def _transcript_alleles(ref: str, alt: str, strand: str | None) -> tuple[str, str]:
    """Return (ref, alt) on the transcript strand. Variant alleles are stored
    as in the VCF, on the forward genomic strand."""
    if strand == "-":
        return ref.translate(_COMPLEMENT)[::-1], alt.translate(_COMPLEMENT)[::-1]
    return ref, alt


def find_counterpart_variant(
    db: Session, variant: dict, other_gene: str, other_pos: int
) -> dict | None:
    """Return the variant at *other_pos* in *other_gene* with the same base
    change as *variant* on the transcript strand, or None."""
    strands = {
        r[0]: r[1]
        for r in db.execute(
            text("SELECT id, strand FROM genes WHERE id IN (:a, :b)"),
            {"a": variant["geneId"], "b": other_gene},
        ).fetchall()
    }
    change = _transcript_alleles(
        variant["ref"], variant["alt"], strands.get(variant["geneId"])
    )
    rows = db.execute(
        text(
            "SELECT id, hgvs, nucleotidePosition, ref, alt, geneId, is_synthetic "
            "FROM variants WHERE geneId=:g AND nucleotidePosition=:p"
        ),
        {"g": other_gene, "p": other_pos},
    ).fetchall()
    for r in rows:
        m = dict(r._mapping)
        if _transcript_alleles(m["ref"], m["alt"], strands.get(other_gene)) == change:
            return m
    return None


def find_or_create_counterpart_variant(db: Session, variant_id: str) -> dict | None:
    """Find or create the counterpart variant for *variant_id*.

    1. Resolve the variant's transcript position.
    2. If that position is mapped, find the counterpart variant in the other
       gene — either an existing row, or auto-create one (flagged synthetic).
    """
    variant = db.execute(
        text(
            "SELECT id, geneId, nucleotidePosition, ref, alt, hgvs "
            "FROM variants WHERE id=:vid"
        ),
        {"vid": variant_id},
    ).fetchone()
    if not variant:
        return None
    vm = dict(variant._mapping)
    nuc = vm.get("nucleotidePosition")
    if nuc is None:
        return None
    cp = find_counterpart(db, vm["geneId"], nuc)
    if not cp:
        return None
    other_gene, other_pos = cp
    existing = db.execute(
        text(
            "SELECT id, hgvs, is_synthetic FROM variants "
            "WHERE geneId=:g AND nucleotidePosition=:p LIMIT 1"
        ),
        {"g": other_gene, "p": other_pos},
    ).fetchone()
    if existing:
        return dict(existing._mapping)
    return _create_counterpart_variant(db, vm, other_gene, other_pos)


def _create_counterpart_variant(
    db: Session, source: dict, target_gene: str, target_pos: int
) -> dict | None:
    """Auto-create a counterpart variant row.

    The target variant gets:
    - same ref/alt bases as the source (both sit on the same RNA base)
    - ``nucleotidePosition = target_pos``
    - ``is_synthetic = True``
    - ``hgvs = n.{target_pos}{ref}>{alt}``
    - genomic position computed from the target gene's coordinates + strand
    - ``geneId = target_gene``
    """
    gene = db.execute(
        text("SELECT start, end, strand, id FROM genes WHERE id=:g"),
        {"g": target_gene},
    ).fetchone()
    if not gene:
        return None
    gm = dict(gene._mapping)
    if gm["strand"] == "-":
        genomic_pos = gm["end"] - target_pos + 1
    else:
        genomic_pos = gm["start"] + target_pos - 1
    hgvs = f"n.{target_pos}{source['ref']}>{source['alt']}"
    chrom_base = gm["id"].replace("chr", "").split("-")[0]
    vid = f"chr{chrom_base}-{genomic_pos}-{source['ref']}-{source['alt']}"

    db.execute(
        text("""
            INSERT INTO variants
                (id, geneId, position, nucleotidePosition, ref, alt, hgvs, is_synthetic)
            VALUES (:id, :gid, :pos, :nuc, :ref, :alt, :hgvs, 1)
            ON CONFLICT(id) DO NOTHING
        """),
        {
            "id": vid,
            "gid": target_gene,
            "pos": genomic_pos,
            "nuc": target_pos,
            "ref": source["ref"],
            "alt": source["alt"],
            "hgvs": hgvs,
        },
    )
    db.commit()
    return {"id": vid, "hgvs": hgvs, "is_synthetic": True}
