// src/lib/equivalentEvidence.ts
// ---------------------------------------------------------------------------
// Equivalent-variant (cross-gene) evidence mapping for the ACMG/AMP framework.
//
// Calibration source: the snRNA variant-classification guidance,
// "Guidance for clinical variant classification in genes for spliceosomal
// small nuclear RNAs", Specific Recommendation 8.
//
// Where two paralogous genes or minor/major spliceosomal analogs are both
// linked to disease with the SAME predicted underlying mechanism, a (likely)
// pathogenic or (likely) benign variant in one gene can be used as evidence
// toward an exact-equivalent variant in the other gene. In the Richards et al.
// (2015) framework this is captured using PM5; in the upcoming SVC v4
// guidelines these count as "informative variants".
//
// Design decision (issue #331): the mapping is GENERIC — an equivalence row
// maps to an evidence code from the classification of the equivalent variant.
// RNUdb only curates equivalences between disease-linked paralogs/analogs that
// are usable as evidence, so there is no per-row mechanism flag: a (likely)
// pathogenic equivalent gives PM5; a (likely) benign equivalent gives an
// informative (SVC v4) code. Anti-circularity remains a curation concern.
// ---------------------------------------------------------------------------

import type { Variant, VariantEquivalence } from "@/types";

export type EquivalentEvidenceCode = "PM5" | "informative" | null;

export interface EquivalentEvidence {
  code: EquivalentEvidenceCode;
  /** Whether the pair can be used as evidence at all. */
  usable: boolean;
  /** Human-readable explanation when not usable. */
  reason?: string;
}

/** A normalized view of an equivalence from the perspective of one gene. */
export interface NormalizedEquivalentPair {
  equivalence: VariantEquivalence;
  /** The variant belonging to the local gene. */
  localVariant: Variant;
  /** The variant in the other (paralog/analog) gene. */
  otherVariant: Variant;
  otherGeneId: string;
}

/**
 * Map an equivalent-variant pair to applicable ACMG evidence.
 *
 * Returns null (and `usable: false`) when the equivalent variant is not
 * classified (likely) pathogenic or benign.
 *
 * @example
 * getEquivalentEvidence({ equivalentClinicalSignificance: "Likely Pathogenic" })
 *   // { code: "PM5", usable: true }
 */
export function getEquivalentEvidence(params: {
  equivalentClinicalSignificance?: string | null;
}): EquivalentEvidence {
  const sig = (params.equivalentClinicalSignificance || "").toLowerCase();
  const isPathogenic = sig.includes("pathogenic") || sig === "p" || sig === "lp";
  const isBenign = sig.includes("benign") || sig === "b" || sig === "lb";

  if (isPathogenic) {
    return { code: "PM5", usable: true };
  }

  if (isBenign) {
    return { code: "informative", usable: true };
  }

  return {
    code: null,
    usable: false,
    reason: "Equivalent variant is not classified (likely) pathogenic or benign",
  };
}

/**
 * Normalize the raw equivalences for a gene into one entry per pair, from the
 * perspective of that gene (local variant = this gene's side, other variant =
 * the paralog/analog side). Pairs that do not involve the gene are dropped.
 */
export function getEquivalentPairsForGene(
  equivalences: VariantEquivalence[],
  geneId: string,
): NormalizedEquivalentPair[] {
  const pairs: NormalizedEquivalentPair[] = [];

  for (const equivalence of equivalences) {
    const { variant: localRaw, equivalent_variant: otherRaw } = equivalence;
    if (!localRaw || !otherRaw) continue;

    let localVariant: Variant;
    let otherVariant: Variant;
    if (localRaw.geneId === geneId && otherRaw.geneId !== geneId) {
      localVariant = localRaw;
      otherVariant = otherRaw;
    } else if (otherRaw.geneId === geneId && localRaw.geneId !== geneId) {
      localVariant = otherRaw;
      otherVariant = localRaw;
    } else {
      // Pair does not involve this gene (or is intra-gene, which should not
      // happen given backend validation).
      continue;
    }

    pairs.push({
      equivalence,
      localVariant,
      otherVariant,
      otherGeneId: otherVariant.geneId,
    });
  }

  return pairs;
}
