"""Tests for the variant equivalences feature (Rec 8 / PM5)."""

import pytest


@pytest.fixture
def equivalence_test_data(test_db, seed_test_data):
    """Add a second gene (RNU4atac) with variants for cross-gene equivalences."""
    from api.models import Gene, Variant

    gene2 = Gene(
        id="RNU4atac",
        name="RNU4atac",
        fullName="RNA, U4atac small nuclear",
        chromosome="chr2",
        start=121530880,
        end=121531009,
        strand="+",
        sequence="aaccauccuuuucuugggguugcgcuacuguccaaugagcgcauagugagggcaguacugcu",
        description="Test U4atac gene",
    )
    v_atac = Variant(
        id="chr2-121530916-G-A",
        geneId="RNU4atac",
        position=121530916,
        nucleotidePosition=37,
        ref="G",
        alt="A",
        hgvs="n.37G>A",
    )
    v_atac2 = Variant(
        id="chr2-121530917-C-T",
        geneId="RNU4atac",
        position=121530917,
        nucleotidePosition=38,
        ref="C",
        alt="T",
        hgvs="n.38C>T",
    )
    test_db.add_all([gene2, v_atac, v_atac2])
    test_db.commit()
    return {
        "gene2": gene2,
        "v_atac": v_atac,
        "v_atac2": v_atac2,
        "rnU4_2_variants": ["V-DEL-001", "V-UPD-001"],
    }


class TestEquivalencesReadAPI:
    """Public read endpoints for variant equivalences."""

    def test_empty_equivalences(self, test_client):
        """GET /api/genes/{id}/equivalences returns [] when none exist."""
        res = test_client.get("/api/genes/RNU4-2/equivalences")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_all_equivalences_empty(self, test_client):
        res = test_client.get("/api/equivalences")
        assert res.status_code == 200
        assert res.json() == []

    def test_variant_equivalences_404(self, test_client, seed_test_data):
        """GET /api/equivalences/{variant} 404s when variant has none."""
        res = test_client.get("/api/equivalences/V-DEL-001")
        assert res.status_code == 404

    def test_gene_equivalences_visible_from_either_side(
        self, test_client, test_db, equivalence_test_data
    ):
        """A pair is returned for both genes' endpoints after seeding."""
        from api.models import VariantEquivalence

        test_db.add(
            VariantEquivalence(
                variant_id="V-DEL-001",
                equivalent_variant_id="chr2-121530916-G-A",
                relationship_type="analog",
                mechanism_match="same",
                evidence_direction="pathogenic",
                status="needs_review",
                functional_region="5' stem-loop",
            )
        )
        test_db.commit()

        res = test_client.get("/api/genes/RNU4-2/equivalences")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        row = data[0]
        assert row["mechanism_match"] == "same"
        assert row["equivalent_variant"]["id"] == "chr2-121530916-G-A"
        assert row["equivalent_variant"]["geneId"] == "RNU4atac"

        res2 = test_client.get("/api/genes/RNU4atac/equivalences")
        assert res2.status_code == 200
        assert len(res2.json()) == 1

    def test_variant_equivalences_after_seed(
        self, test_client, test_db, equivalence_test_data
    ):
        from api.models import VariantEquivalence

        test_db.add(
            VariantEquivalence(
                variant_id="V-DEL-001",
                equivalent_variant_id="chr2-121530916-G-A",
                relationship_type="analog",
                mechanism_match="same",
                evidence_direction="pathogenic",
            )
        )
        test_db.commit()
        res = test_client.get("/api/equivalences/V-DEL-001")
        assert res.status_code == 200
        assert len(res.json()) == 1


class TestEquivalenceApprovalFlow:
    """Equivalence writes are applied through the approval workflow."""

    def _create_pending(self, client, payload):
        return client.post("/api/approvals", json=payload)

    def _approve_and_apply(self, client, change_id):
        res = client.post(
            f"/api/approvals/{change_id}/review", json={"status": "approved"}
        )
        assert res.status_code == 200
        return client.post(f"/api/approvals/{change_id}/apply")

    def test_create_and_apply_equivalence(self, test_client, equivalence_test_data):
        """A pending equivalence create can be reviewed and applied."""
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "chr2-121530916-G-A",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "functional_region": "5' stem-loop",
                "evidence_direction": "pathogenic",
                "status": "needs_review",
                "notes": "Paper worked example pair",
            },
        }
        create_res = self._create_pending(test_client, payload)
        assert create_res.status_code == 200
        change_id = create_res.json()["id"]

        apply_res = self._approve_and_apply(test_client, change_id)
        assert apply_res.status_code == 200
        assert apply_res.json()["status"] == "applied"

        list_res = test_client.get("/api/equivalences")
        assert list_res.status_code == 200
        rows = list_res.json()
        assert len(rows) == 1
        assert rows[0]["functional_region"] == "5' stem-loop"
        assert rows[0]["relationship_type"] == "analog"

    def test_create_orders_pair(self, test_client, equivalence_test_data):
        """Unordered input is normalised to variant_id < equivalent_variant_id."""
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "chr2-121530916-G-A",
                "equivalent_variant_id": "V-DEL-001",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        create_res = self._create_pending(test_client, payload)
        apply_res = self._approve_and_apply(test_client, create_res.json()["id"])
        assert apply_res.status_code == 200

        rows = test_client.get("/api/equivalences").json()
        assert rows[0]["variant_id"] == "V-DEL-001"
        assert rows[0]["equivalent_variant_id"] == "chr2-121530916-G-A"

    def test_apply_same_gene_rejected(self, test_client, seed_test_data):
        """Equivalent variants must belong to different genes (400 on apply)."""
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "V-UPD-001",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        create_res = self._create_pending(test_client, payload)
        apply_res = self._approve_and_apply(test_client, create_res.json()["id"])
        assert apply_res.status_code == 400
        assert "different genes" in apply_res.json()["detail"]

    def test_apply_nonexistent_variant_rejected(self, test_client, seed_test_data):
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "chr99-1-A-T",
                "equivalent_variant_id": "V-DEL-001",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        create_res = self._create_pending(test_client, payload)
        apply_res = self._approve_and_apply(test_client, create_res.json()["id"])
        assert apply_res.status_code == 400
        assert "does not exist" in apply_res.json()["detail"]

    def test_apply_self_equivalence_rejected(self, test_client, seed_test_data):
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "V-DEL-001",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        create_res = self._create_pending(test_client, payload)
        apply_res = self._approve_and_apply(test_client, create_res.json()["id"])
        assert apply_res.status_code == 400
        assert "equivalent to itself" in apply_res.json()["detail"]

    def test_apply_duplicate_equivalence_rejected(
        self, test_client, equivalence_test_data
    ):
        base = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "chr2-121530916-G-A",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        c1 = self._create_pending(test_client, base)
        assert self._approve_and_apply(test_client, c1.json()["id"]).status_code == 200

        c2 = self._create_pending(test_client, base)
        apply2 = self._approve_and_apply(test_client, c2.json()["id"])
        assert apply2.status_code == 400
        assert "already exists" in apply2.json()["detail"]

    def test_update_equivalence(self, test_client, equivalence_test_data):
        """Update mechanism_match etc. via the approval flow."""
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "chr2-121530916-G-A",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        c1 = self._create_pending(test_client, payload)
        assert self._approve_and_apply(test_client, c1.json()["id"]).status_code == 200

        update_payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "entity_id": "V-DEL-001|chr2-121530916-G-A",
            "action": "update",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "chr2-121530916-G-A",
                "mechanism_match": "different",
                "notes": "Dominant GoF vs recessive LoF",
            },
        }
        c2 = self._create_pending(test_client, update_payload)
        apply2 = self._approve_and_apply(test_client, c2.json()["id"])
        assert apply2.status_code == 200

        rows = test_client.get("/api/equivalences").json()
        assert rows[0]["mechanism_match"] == "different"
        assert rows[0]["notes"] == "Dominant GoF vs recessive LoF"

    def test_delete_equivalence(self, test_client, equivalence_test_data):
        """Delete a pair via the approval flow."""
        payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "action": "create",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "chr2-121530916-G-A",
                "relationship_type": "analog",
                "mechanism_match": "same",
                "evidence_direction": "pathogenic",
            },
        }
        c1 = self._create_pending(test_client, payload)
        assert self._approve_and_apply(test_client, c1.json()["id"]).status_code == 200

        delete_payload = {
            "entity_type": "equivalence",
            "gene_id": "RNU4-2",
            "entity_id": "V-DEL-001|chr2-121530916-G-A",
            "action": "delete",
            "payload": {
                "variant_id": "V-DEL-001",
                "equivalent_variant_id": "chr2-121530916-G-A",
            },
        }
        c2 = self._create_pending(test_client, delete_payload)
        apply2 = self._approve_and_apply(test_client, c2.json()["id"])
        assert apply2.status_code == 200

        assert test_client.get("/api/equivalences").json() == []

    def test_equivalence_entity_type_accepted(self, test_client, seed_test_data):
        """The approvals API accepts 'equivalence' as an entity type."""
        res = self._create_pending(
            test_client,
            {
                "entity_type": "equivalence",
                "gene_id": "RNU4-2",
                "action": "create",
                "payload": {
                    "variant_id": "V-DEL-001",
                    "equivalent_variant_id": "V-UPD-001",
                    "relationship_type": "analog",
                    "mechanism_match": "same",
                    "evidence_direction": "pathogenic",
                },
            },
        )
        assert res.status_code == 200
        assert res.json()["entity_type"] == "equivalence"
