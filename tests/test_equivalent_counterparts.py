"""Counterpart lookup must return the same base change, not any variant at the
mapped position. RNU4-2 is on the minus strand and RNU4atac on the plus strand
(GRCh38), so the stored VCF alleles of equivalent variants are complements."""

import pytest


@pytest.fixture
def worked_example(test_db):
    """RNU4-2 n.32G>A is equivalent to RNU4atac n.37G>A (Rec 8 worked example)."""
    from api.models import EquivalentPosition, Gene, Variant

    test_db.add_all(
        [
            Gene(
                id="RNU4-2",
                name="RNU4-2",
                fullName="RNA, U4 small nuclear 2",
                chromosome="chr12",
                start=120291759,
                end=120291903,
                strand="-",
                sequence="N",
                description="",
            ),
            Gene(
                id="RNU4atac",
                name="RNU4atac",
                fullName="RNA, U4atac small nuclear",
                chromosome="chr2",
                start=121530880,
                end=121531009,
                strand="+",
                sequence="N",
                description="",
            ),
        ]
    )
    test_db.commit()
    test_db.add(
        EquivalentPosition(gene_a="RNU4-2", pos_a=32, gene_b="RNU4atac", pos_b=37)
    )
    # Non-equivalent allele inserted first so a position-only lookup returns it.
    rows = [
        ("chr2-121530916-G-C", "RNU4atac", 121530916, 37, "G", "C", "n.37G>C"),
        ("chr2-121530916-G-A", "RNU4atac", 121530916, 37, "G", "A", "n.37G>A"),
        ("chr12-120291872-C-G", "RNU4-2", 120291872, 32, "C", "G", "n.32G>C"),
        ("chr12-120291872-C-T", "RNU4-2", 120291872, 32, "C", "T", "n.32G>A"),
        ("chr12-120291872-C-A", "RNU4-2", 120291872, 32, "C", "A", "n.32G>T"),
    ]
    for vid, gene, pos, nuc, ref, alt, hgvs in rows:
        test_db.add(
            Variant(
                id=vid,
                geneId=gene,
                position=pos,
                nucleotidePosition=nuc,
                ref=ref,
                alt=alt,
                hgvs=hgvs,
            )
        )
    test_db.commit()


def _counterpart_hgvs(client, variant_id):
    res = client.get(f"/api/variants/{variant_id}/equivalent")
    assert res.status_code == 200
    cp = res.json()["counterpart"]
    return cp["hgvs"] if cp else None


def test_single_variant_counterpart_matches_base_change(test_client, worked_example):
    assert _counterpart_hgvs(test_client, "chr12-120291872-C-T") == "n.37G>A"
    assert _counterpart_hgvs(test_client, "chr2-121530916-G-A") == "n.32G>A"
    assert _counterpart_hgvs(test_client, "chr12-120291872-C-G") == "n.37G>C"
    assert _counterpart_hgvs(test_client, "chr2-121530916-G-C") == "n.32G>C"


def test_no_counterpart_when_equivalent_allele_absent(test_client, worked_example):
    assert _counterpart_hgvs(test_client, "chr12-120291872-C-A") is None


def test_gene_variant_equivalents_match_base_change(test_client, worked_example):
    res = test_client.get("/api/genes/RNU4-2/variant-equivalents")
    assert res.status_code == 200
    pairs = {
        e["variant"]["hgvs"]: (e["counterpart"] or {}).get("hgvs") for e in res.json()
    }
    assert pairs == {"n.32G>C": "n.37G>C", "n.32G>A": "n.37G>A", "n.32G>T": None}
