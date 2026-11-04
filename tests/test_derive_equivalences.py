"""Tests for scripts/derive_equivalences.py (seed CSV generation)."""

import csv
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from derive_equivalences import (  # noqa: E402
    best_literature_for,
    build_position_map,
    is_recessive_pathogenic,
    needleman_wunsch,
)

CSV_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "equivalences" / "equivalences.csv"
)


class TestAlignment:
    def test_needleman_wunsch_identical(self):
        a, b = needleman_wunsch("ACGU", "ACGU")
        assert a == b == "ACGU"

    def test_needleman_wunsch_one_del(self):
        a, b = needleman_wunsch("ACG", "AG")
        assert a.replace("-", "") == "ACG"
        assert b.replace("-", "") == "AG"

    def test_position_map_respects_gaps(self):
        aln_a, aln_b = needleman_wunsch("ACGU", "ACU")
        pm = build_position_map(aln_a, aln_b)
        # A(1)->A(1), C(2)->C(2), G(3)->gap, U(4)->U(3)
        assert pm[1] == 1
        assert pm[2] == 2
        assert 3 not in pm
        assert pm[4] == 3


class TestClassificationHelpers:
    def test_best_literature_for_picks_strongest(self):
        classifications = {
            "V1": [
                {
                    "clinical_significance": "VUS",
                    "disease": "X",
                    "inheritance": "",
                    "literature_id": "lit-vus",
                },
                {
                    "clinical_significance": "Likely Pathogenic",
                    "disease": "Recessive X",
                    "inheritance": "",
                    "literature_id": "lit-lp",
                },
                {
                    "clinical_significance": "Pathogenic",
                    "disease": "Recessive X",
                    "inheritance": "",
                    "literature_id": "lit-p",
                },
            ]
        }
        assert best_literature_for("V1", classifications) == "lit-p"

    def test_best_literature_for_empty(self):
        assert best_literature_for("missing", {}) == ""

    def test_is_recessive_pathogenic_true(self):
        classifications = {
            "V1": [
                {
                    "clinical_significance": "Likely Pathogenic",
                    "disease": "Recessive NDD",
                    "inheritance": "Biallelic",
                    "literature_id": "lit",
                }
            ]
        }
        assert is_recessive_pathogenic("V1", classifications, "RNU4-2") is True

    def test_is_recessive_pathogenic_false_for_dominant(self):
        classifications = {
            "V1": [
                {
                    "clinical_significance": "Pathogenic",
                    "disease": "ReNU Syndrome",
                    "inheritance": "Dominant",
                    "literature_id": "lit",
                }
            ]
        }
        # ReNU is dominant -> not recessive-mechanism evidence.
        assert is_recessive_pathogenic("V1", classifications, "RNU4-2") is False

    def test_is_recessive_pathogenic_false_for_vus(self):
        classifications = {
            "V1": [
                {
                    "clinical_significance": "VUS",
                    "disease": "Recessive NDD",
                    "inheritance": "Biallelic",
                    "literature_id": "lit",
                }
            ]
        }
        assert is_recessive_pathogenic("V1", classifications, "RNU4-2") is False

    @pytest.mark.skipif(not CSV_PATH.exists(), reason="Seed CSV not generated")
    def test_ship_csv_has_literature_id_on_every_row(self):
        """Every shipped equivalence row carries a source paper id."""
        with CSV_PATH.open(newline="") as fh:
            rows = list(csv.DictReader(fh))
        assert len(rows) > 0
        assert all(r["literature_id"] for r in rows), "All rows must have literature_id"
        assert all(r["status"] == "needs_review" for r in rows), (
            "All rows must be needs_review"
        )

    @pytest.mark.skipif(not CSV_PATH.exists(), reason="Seed CSV not generated")
    def test_ship_csv_contains_anchor_pair(self):
        """The guidance worked-example pair must be present."""
        with CSV_PATH.open(newline="") as fh:
            rows = list(csv.DictReader(fh))
        pair_keys = {
            frozenset((r["variant_id"], r["equivalent_variant_id"])) for r in rows
        }
        assert frozenset(("chr2-121530916-G-A", "chr12-120291872-C-T")) in pair_keys
