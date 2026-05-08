import { describe, it, expect } from "vitest";
import {
  placeholderGene,
  placeholderVariants,
  placeholderLiterature,
  placeholderStructure,
} from "./placeholder";
import type { Variant, Literature, RNAStructure } from "@/types";

describe("placeholderGene", () => {
  it("has valid gene structure", () => {
    expect(placeholderGene.id).toBe("RNU4-2");
    expect(placeholderGene.name).toBe("RNU4-2");
    expect(placeholderGene.fullName).toBe("RNA, U4 small nuclear 2");
    expect(placeholderGene.chromosome).toBe("12");
    expect(placeholderGene.strand).toBe("-");
    expect(typeof placeholderGene.start).toBe("number");
    expect(typeof placeholderGene.end).toBe("number");
    expect(typeof placeholderGene.sequence).toBe("string");
    expect(placeholderGene.sequence.length).toBeGreaterThan(0);
  });

  it("has valid sequence containing only RNA bases", () => {
    const validBases = /^[AUGC]+$/i;
    expect(validBases.test(placeholderGene.sequence)).toBe(true);
  });
});

describe("placeholderVariants", () => {
  it("is an array of variants", () => {
    expect(Array.isArray(placeholderVariants)).toBe(true);
    expect(placeholderVariants.length).toBeGreaterThan(0);
  });

  it("has valid variant structure", () => {
    const variant = placeholderVariants[0];
    expect(variant.id).toBe("test_variant_1");
    expect(variant.geneId).toBe("RNU4-2");
    expect(variant.position).toBe(120291859);
    expect(variant.ref).toBe("A");
    expect(variant.alt).toBe("G");
    expect(variant.hgvs).toBe("n.45A>G");
    expect(variant.consequence).toBe("structural_variant");
  });

  it("has required fields for Variant type", () => {
    const variant: Variant = placeholderVariants[0];
    expect(variant.id).toBeDefined();
    expect(variant.geneId).toBeDefined();
    expect(variant.position).toBeDefined();
    expect(variant.ref).toBeDefined();
    expect(variant.alt).toBeDefined();
  });
});

describe("placeholderLiterature", () => {
  it("is an array of literature", () => {
    expect(Array.isArray(placeholderLiterature)).toBe(true);
    expect(placeholderLiterature.length).toBeGreaterThan(0);
  });

  it("has valid literature structure", () => {
    const lit = placeholderLiterature[0];
    expect(lit.id).toBe("test_paper_1");
    expect(lit.title).toBe("Test Research Paper on U4 snRNA");
    expect(lit.authors).toBe("Researcher, A. et al.");
    expect(lit.journal).toBe("Test Journal");
    expect(lit.year).toBe("2023");
    expect(lit.doi).toBe("10.1234/test.doi.2023");
  });

  it("has required fields for Literature type", () => {
    const lit: Literature = placeholderLiterature[0];
    expect(lit.id).toBeDefined();
    expect(lit.title).toBeDefined();
    expect(lit.authors).toBeDefined();
    expect(lit.journal).toBeDefined();
    expect(lit.year).toBeDefined();
    expect(lit.doi).toBeDefined();
  });
});

describe("placeholderStructure", () => {
  it("has valid structure", () => {
    expect(placeholderStructure.id).toBe("test_structure");
    expect(placeholderStructure.gene_id).toBe("RNU4-2");
  });

  it("has valid nucleotides", () => {
    expect(placeholderStructure.nucleotides).toHaveLength(3);
    expect(placeholderStructure.nucleotides[0].base).toBe("A");
    expect(placeholderStructure.nucleotides[0].id).toBe(1);
    expect(placeholderStructure.nucleotides[0].x).toBe(100);
    expect(placeholderStructure.nucleotides[0].y).toBe(100);
  });

  it("has valid base pairs", () => {
    expect(placeholderStructure.base_pairs).toHaveLength(1);
    expect(placeholderStructure.base_pairs[0].from_pos).toBe(1);
    expect(placeholderStructure.base_pairs[0].to_pos).toBe(3);
  });

  it("has valid annotations", () => {
    expect(placeholderStructure.annotations).toBeDefined();
    expect(placeholderStructure.annotations?.length).toBe(1);
    expect(placeholderStructure.annotations?.[0].id).toBe("test_annotation");
    expect(placeholderStructure.annotations?.[0].text).toBe("Test");
  });

  it("matches RNAStructure type", () => {
    const struct: RNAStructure = placeholderStructure;
    expect(struct.id).toBeDefined();
    expect(struct.nucleotides).toBeDefined();
    expect(struct.base_pairs).toBeDefined();
  });
});
