// Variant data utilities
import { getGeneVariants, getVariant } from "../services/api";
import type { Variant } from "../types";

// Fallback clinical variants data (matches database structure)
const fallbackClinicalVariants: Variant[] = [
  {
    id: "chr12-120291764-C-T",
    geneId: "RNU4-2",
    position: 120291764,
    nucleotidePosition: 140,
    ref: "C",
    alt: "T",
    hgvs: "n.140G>A",
    clinical_significance: "VUS",
    zygosity: "hom",
    gnomad_ac: 5,
    aou_ac: 37,
    cohort: "clinical",
  },
  {
    id: "chr12-120291769-T-C",
    geneId: "RNU4-2",
    position: 120291769,
    nucleotidePosition: 135,
    ref: "T",
    alt: "C",
    hgvs: "n.135A>G",
    clinical_significance: "VUS",
    zygosity: "het",
    gnomad_ac: 8,
    aou_ac: 13,
    cohort: "clinical",
  },
  {
    id: "chr12-120291775-C-T",
    geneId: "RNU4-2",
    position: 120291775,
    nucleotidePosition: 129,
    ref: "C",
    alt: "T",
    hgvs: "n.129G>A",
    clinical_significance: "VUS",
    zygosity: "het",
    gnomad_ac: 3,
    aou_ac: 8,
    cohort: "clinical",
  },
  {
    id: "chr12-120291777-G-A",
    geneId: "RNU4-2",
    position: 120291777,
    nucleotidePosition: 127,
    ref: "G",
    alt: "A",
    hgvs: "n.127C>T",
    clinical_significance: "VUS",
    zygosity: "hom",
    gnomad_ac: 170,
    aou_ac: 935,
    cohort: "clinical",
  },
  {
    id: "chr12-120291782-A-C",
    geneId: "RNU4-2",
    position: 120291782,
    nucleotidePosition: 122,
    ref: "A",
    alt: "C",
    hgvs: "n.122T>G",
    clinical_significance: "Likely Pathogenic",
    zygosity: "het",
    gnomad_ac: 1,
    aou_ac: 6,
    cohort: "clinical",
  },
  {
    id: "chr12-120291785-T-C",
    geneId: "RNU4-2",
    position: 120291785,
    nucleotidePosition: 119,
    ref: "T",
    alt: "C",
    hgvs: "n.119A>G",
    clinical_significance: "Pathogenic",
    zygosity: "hom",
    gnomad_ac: 37,
    aou_ac: 219,
    cohort: "clinical",
  },
];

export const getVariants = async (geneId: string): Promise<Variant[]> => {
  try {
    const apiVariants = await getGeneVariants(geneId);
    // If API returns data, use it
    if (apiVariants && apiVariants.length > 0) {
      return apiVariants;
    }
    // Otherwise fall back to clinical variants for demo
    console.log("API not available, using fallback clinical variants data");
    return fallbackClinicalVariants;
  } catch (error) {
    console.error(`Error fetching variants for ${geneId}:`, error);
    console.log("Using fallback clinical variants data");
    return fallbackClinicalVariants;
  }
};

export const getVariantById = async (
  variantId: string,
): Promise<Variant | null> => {
  try {
    return await getVariant(variantId);
  } catch (error) {
    console.error(`Error fetching variant ${variantId}:`, error);
    return null;
  }
};
