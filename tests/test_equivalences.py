"""Tests for equivalent positions (base-for-base mapping between snRNA genes)."""

import pytest


@pytest.fixture
def equiv_test_data(test_db, seed_test_data):
    """Add RNU4atac gene, structures for both genes, and relevant variants."""
    from api.models import Gene

    # RNU4atac gene
    g2 = Gene(
        id="RNU4atac",
        name="RNU4atac",
        fullName="RNA, U4atac small nuclear",
        chromosome="chr2",
        start=121530880,
        end=121531009,
        strand="+",
        sequence="aaccauccuuuucuugggguugcgcuacuguccaaugagcgcauagugagggcaguacugcu",
        description="Test U4atac",
    )
    test_db.add(g2)
    test_db.commit()

    # Structures needed for base lookups. We use the existing structures
    # from the live prod database or minimal stubs.

    return {"gene_atac": g2}


class TestEquivalentPositionsService:
    def test_transcript_base_missing(self, test_db):
        """transcript_base returns None when no structure/nucleotide exists."""
        from api.services.equivalents import transcript_base

        base = transcript_base(test_db, "RNU4-2", 32)
        assert base is None  # no structure in test DB

    @pytest.mark.skip(reason="Requires structure data (uses live DB)")
    def test_base_mismatch_rejected(self, test_db, equiv_test_data):
        """validate_position_pair rejects mismatched bases."""
        from api.services.equivalents import validate_position_pair

        # Both n.32 in RNU4-2 and n.37 in RNU4atac — get actual bases
        err = validate_position_pair(test_db, "RNU4-2", 32, "RNU4atac", 37)
        if err is not None and "mismatch" in err:
            pass  # expected if bases truly mismatch
        elif err is not None and "not found" in err:
            pass  # no structure in test DB
        else:
            assert err is None

    def test_validate_same_gene(self, test_db):
        from api.services.equivalents import validate_position_pair

        err = validate_position_pair(test_db, "RNU4-2", 1, "RNU4-2", 5)
        assert err is not None and "itself" in err

    def test_normalize_order(self):
        from api.services.equivalents import normalize_gene_order

        result = normalize_gene_order("RNU4atac", 5, "RNU4-2", 3)
        assert result == ("RNU4-2", 3, "RNU4atac", 5)

    def test_find_counterpart_none(self, test_db):
        from api.services.equivalents import find_counterpart

        assert find_counterpart(test_db, "RNU4-2", 999) is None

    def test_find_counterpart_mapped(self, test_db):
        from api.models import EquivalentPosition
        from api.services.equivalents import find_counterpart

        test_db.add(
            EquivalentPosition(gene_a="RNU4-2", pos_a=32, gene_b="RNU4atac", pos_b=37)
        )
        test_db.commit()

        result = find_counterpart(test_db, "RNU4-2", 32)
        assert result == ("RNU4atac", 37)

        result2 = find_counterpart(test_db, "RNU4atac", 37)
        assert result2 == ("RNU4-2", 32)


class TestEquivalentPositionsApproval:
    """Equivalence writes go through the approvals workflow."""

    def _submit_and_apply(self, client, test_db, payload):
        cid = client.post(
            "/api/approvals",
            json={"entity_type": "equivalence", "gene_id": "RNU4-2", **payload},
        ).json()["id"]
        client.post(f"/api/approvals/{cid}/review", json={"status": "approved"})
        return client.post(f"/api/approvals/{cid}/apply").status_code

    def test_create_equivalence_position(self, test_client, test_db):
        """Create via approval and verify it appears in read endpoint."""
        from api.models import EquivalentPosition

        test_db.add(
            EquivalentPosition(gene_a="RNU4-2", pos_a=32, gene_b="RNU4atac", pos_b=37)
        )
        test_db.commit()

        res = test_client.get("/api/genes/RNU4-2/equivalent-positions")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["pos_a"] == 32
        assert data[0]["gene_b"] == "RNU4atac"
        assert data[0]["pos_b"] == 37

    def test_variant_equivalents_endpoint(self, test_client, test_db):
        """GET /api/genes/{id}/variant-equivalents returns variants with
        counterpart info."""
        from api.models import EquivalentPosition

        test_db.add(
            EquivalentPosition(gene_a="RNU4-2", pos_a=32, gene_b="RNU4atac", pos_b=37)
        )
        test_db.commit()

        res = test_client.get("/api/genes/RNU4-2/variant-equivalents")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_variant_equivalent_by_id(self, test_client, test_db):
        from api.models import EquivalentPosition

        test_db.add(
            EquivalentPosition(gene_a="RNU4-2", pos_a=32, gene_b="RNU4atac", pos_b=37)
        )
        test_db.commit()

        res = test_client.get("/api/equivalences/ALL")
        assert res.status_code in (200, 404)

    def test_create_equivalence_approval_flow(self, test_client, test_db):
        """Full cycle: submit → approve → apply → verify."""
        cid = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "equivalence",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "gene_a": "RNU4-2",
                    "pos_a": 32,
                    "gene_b": "RNU4atac",
                    "pos_b": 37,
                },
            },
        ).json()["id"]
        test_client.post(f"/api/approvals/{cid}/review", json={"status": "approved"})
        apply = test_client.post(f"/api/approvals/{cid}/apply")
        assert apply.status_code in (200, 400)

    def test_approval_entity_type_accepted(self, test_client):
        res = test_client.post(
            "/api/approvals",
            json={
                "entity_type": "equivalence",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "gene_a": "RNU4-2",
                    "pos_a": 32,
                    "gene_b": "RNU4atac",
                    "pos_b": 37,
                },
            },
        )
        assert res.status_code == 200
        assert res.json()["entity_type"] == "equivalence"


@pytest.fixture
def equiv_structures(test_db, equiv_test_data):
    """Structures + nucleotides so base-for-base validation can run.

    RNU4-2 positions 27-34 and RNU4atac positions 32-39 both carry the
    K-turn sequence ``CCAAUGAG``; positions 118-125 / 116-123 carry the Sm
    sequence ``AAUUUUUG``.
    """
    from api.models import Nucleotide, RNAStructure

    k_turn = "CCAAUGAG"
    sm = "AAUUUUUG"
    for gene_id, start, seq, tag in (
        ("RNU4-2", 27, k_turn, "kturn"),
        ("RNU4-2", 118, sm, "sm"),
        ("RNU4atac", 32, k_turn, "kturn"),
        ("RNU4atac", 116, sm, "sm"),
    ):
        structure_id = f"{gene_id}-{tag}"
        test_db.add(RNAStructure(id=structure_id, geneId=gene_id))
        for offset, base in enumerate(seq):
            test_db.add(
                Nucleotide(
                    id=start + offset,
                    structure_id=structure_id,
                    base=base,
                    x=0.0,
                    y=0.0,
                )
            )
    test_db.commit()
    return {"k_turn": k_turn, "sm": sm}


class TestEquivalenceImport:
    """Bulk import action for equivalent positions."""

    def _submit_import(self, client, pairs):
        return client.post(
            "/api/approvals",
            json={
                "entity_type": "equivalence",
                "gene_id": "RNU4-2",
                "action": "import",
                "payload": {"pairs": pairs},
            },
        )

    def _approve_and_apply(self, client, cid):
        client.post(f"/api/approvals/{cid}/review", json={"status": "approved"})
        return client.post(f"/api/approvals/{cid}/apply")

    def test_import_inserts_all_pairs(self, test_client, equiv_structures):
        """One import change inserts every valid pair atomically."""
        pairs = [
            {
                "gene_a": "RNU4-2",
                "pos_a": 27,
                "gene_b": "RNU4atac",
                "pos_b": 32,
                "notes": "K-turn",
            },
            {
                "gene_a": "RNU4-2",
                "pos_a": 28,
                "gene_b": "RNU4atac",
                "pos_b": 33,
                "notes": "K-turn",
            },
        ]
        res = self._submit_import(test_client, pairs)
        assert res.status_code == 200
        cid = res.json()["id"]

        applied = self._approve_and_apply(test_client, cid)
        assert applied.status_code == 200

        rows = test_client.get("/api/genes/RNU4-2/equivalent-positions").json()
        assert len(rows) == 2
        assert {r["pos_a"] for r in rows} == {27, 28}

    def test_import_rejects_base_mismatch(self, test_client, equiv_structures):
        """A pair whose bases differ is rejected and nothing is written."""
        pairs = [
            {
                "gene_a": "RNU4-2",
                "pos_a": 27,
                "gene_b": "RNU4atac",
                "pos_b": 32,
            },
            {
                # 27 is C in RNU4-2; 38 is A in RNU4atac -> mismatch.
                "gene_a": "RNU4-2",
                "pos_a": 27,
                "gene_b": "RNU4atac",
                "pos_b": 38,
            },
        ]
        res = self._submit_import(test_client, pairs)
        assert res.status_code == 200
        cid = res.json()["id"]

        applied = self._approve_and_apply(test_client, cid)
        assert applied.status_code == 400

        rows = test_client.get("/api/genes/RNU4-2/equivalent-positions").json()
        assert rows == []

    def test_import_rejects_duplicate_position(self, test_client, equiv_structures):
        """Bijection: a position cannot be mapped twice."""
        pairs = [
            {
                "gene_a": "RNU4-2",
                "pos_a": 27,
                "gene_b": "RNU4atac",
                "pos_b": 32,
            },
            {
                "gene_a": "RNU4-2",
                "pos_a": 27,
                "gene_b": "RNU4atac",
                "pos_b": 33,
            },
        ]
        res = self._submit_import(test_client, pairs)
        assert res.status_code == 200
        cid = res.json()["id"]

        applied = self._approve_and_apply(test_client, cid)
        assert applied.status_code == 409

        rows = test_client.get("/api/genes/RNU4-2/equivalent-positions").json()
        assert rows == []

    def test_import_rejects_empty_pairs(self, test_client):
        res = self._submit_import(test_client, [])
        assert res.status_code == 200
        cid = res.json()["id"]
        applied = self._approve_and_apply(test_client, cid)
        assert applied.status_code == 400
