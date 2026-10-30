// Tests for src/lib/equivalentEvidence.ts
import { describe, expect, it } from "vitest";
import { getEquivalentEvidence, getEquivalentPairsForGene } from "./equivalentEvidence";
import type { VariantEquivalence } from "@/types";

describe("getEquivalentEvidence", () => {
  it("returns PM5 for a pathogenic equivalent with same mechanism", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: "Pathogenic",
    });
    expect(result.code).toBe("PM5");
    expect(result.usable).toBe(true);
  });

  it("returns PM5 for a Likely Pathogenic equivalent", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: "Likely Pathogenic",
    });
    expect(result).toEqual({ code: "PM5", usable: true });
  });

  it("returns informative for a benign equivalent when direction is benign", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "benign",
      equivalentClinicalSignificance: "Benign",
    });
    expect(result.code).toBe("informative");
    expect(result.usable).toBe(true);
  });

  it("returns informative for a benign equivalent when direction is both", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "both",
      equivalentClinicalSignificance: "Likely Benign",
    });
    expect(result.code).toBe("informative");
    expect(result.usable).toBe(true);
  });

  it("returns PM5 over informative for a pathogenic equivalent when direction is both", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "both",
      equivalentClinicalSignificance: "Pathogenic",
    });
    expect(result.code).toBe("PM5");
  });

  it("is not usable when mechanisms differ even if the equivalent is pathogenic", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "different",
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: "Pathogenic",
    });
    expect(result.usable).toBe(false);
    expect(result.code).toBeNull();
    expect(result.reason).toContain("mechanism");
  });

  it("is not usable when the equivalent is a VUS", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: "VUS",
    });
    expect(result.usable).toBe(false);
    expect(result.code).toBeNull();
  });

  it("is not usable when metadata is missing", () => {
    const result = getEquivalentEvidence({
      mechanism_match: null,
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: "Pathogenic",
    });
    expect(result.usable).toBe(false);
    expect(result.code).toBeNull();
  });

  it("is not usable for unknown mechanism", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "unknown",
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: "Pathogenic",
    });
    expect(result.usable).toBe(false);
  });

  it("handles missing classification without crashing", () => {
    const result = getEquivalentEvidence({
      mechanism_match: "same",
      evidence_direction: "pathogenic",
      equivalentClinicalSignificance: null,
    });
    expect(result.usable).toBe(false);
  });
});

function makeEquivalence(overrides: Partial<VariantEquivalence> = {}) {
  return {
    variant_id: "chr12-120291872-C-T",
    equivalent_variant_id: "chr2-121530916-G-A",
    relationship_type: "analog" as const,
    mechanism_match: "same" as const,
    evidence_direction: "pathogenic" as const,
    status: "needs_review",
    variant: {
      id: "chr12-120291872-C-T",
      geneId: "RNU4-2",
      position: 120291872,
      nucleotidePosition: 32,
      ref: "C",
      alt: "T",
      hgvs: "n.32G>A",
      clinical_significance: "Likely Pathogenic",
    },
    equivalent_variant: {
      id: "chr2-121530916-G-A",
      geneId: "RNU4atac",
      position: 121530916,
      nucleotidePosition: 37,
      ref: "G",
      alt: "A",
      hgvs: "n.37G>A",
      clinical_significance: "VUS",
    },
    ...overrides,
  } as VariantEquivalence;
}

describe("getEquivalentPairsForGene", () => {
  const pair = makeEquivalence();

  it("orients the pair with the local gene as the local variant", () => {
    const pairs = getEquivalentPairsForGene([pair], "RNU4-2");
    expect(pairs).toHaveLength(1);
    expect(pairs[0].localVariant.geneId).toBe("RNU4-2");
    expect(pairs[0].localVariant.hgvs).toBe("n.32G>A");
    expect(pairs[0].otherVariant.geneId).toBe("RNU4atac");
    expect(pairs[0].otherGeneId).toBe("RNU4atac");
  });

  it("orients correctly when the local gene is the equivalent side", () => {
    const pairs = getEquivalentPairsForGene([pair], "RNU4atac");
    expect(pairs).toHaveLength(1);
    expect(pairs[0].localVariant.geneId).toBe("RNU4atac");
    expect(pairs[0].localVariant.hgvs).toBe("n.37G>A");
    expect(pairs[0].otherVariant.geneId).toBe("RNU4-2");
  });

  it("drops pairs that do not involve the gene", () => {
    const pairs = getEquivalentPairsForGene([pair], "RNU12");
    expect(pairs).toHaveLength(0);
  });

  it("drops pairs with missing flattened variant data", () => {
    const incomplete = makeEquivalence({ variant: null });
    const pairs = getEquivalentPairsForGene([incomplete], "RNU4-2");
    expect(pairs).toHaveLength(0);
  });
});
