import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SnRNAGene, Variant } from "@/types";

const mockGenes: SnRNAGene[] = [
  {
    id: "RNU4-2",
    name: "RNU4-2",
    fullName: "RNA, U4 small nuclear 2",
    chromosome: "12",
    start: 120291759,
    end: 120291903,
    strand: "-",
    sequence:
      "AUACUUACCUGAUUAGGUAGUGCAUUUCGUUCUAGACCUGAAGUGAUCCUGAGGGAAUUUCCCGACCGAAGCCGAAGCAACUUCGGUCGGAAUUCCCUCAGGAUCACUUCAGGUCUAGAACGA",
    description: "U4 small nuclear RNA",
  },
  {
    id: "RNU4ATAC",
    name: "RNU4ATAC",
    fullName: "RNA, U4atac small nuclear",
    chromosome: "1",
    start: 100000,
    end: 100200,
    strand: "+",
    sequence: "AUG...",
    description: "U4atac small nuclear RNA",
  },
];

const mockVariants: Variant[] = [
  {
    id: "var-1",
    geneId: "RNU4-2",
    position: 120291859,
    ref: "A",
    alt: "G",
    hgvs: "n.45A>G",
    consequence: "structural_variant",
    clinical_significance: "Pathogenic",
  },
  {
    id: "var-2",
    geneId: "RNU4-2",
    position: 120291860,
    ref: "U",
    alt: "C",
    hgvs: "n.46U>C",
    consequence: "missense",
    clinvar_significance: "Benign",
  },
];

vi.mock("./api", () => ({
  getAllGenes: vi.fn(() => Promise.resolve(mockGenes)),
  getGeneVariants: vi.fn(() => Promise.resolve(mockVariants)),
}));

import { getAllGenes, getGeneVariants } from "./api";
import { searchService } from "./search";

describe("searchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the search service state by creating a new instance
    Object.defineProperty(searchService, "initialized", {
      value: false,
      writable: true,
    });
  });

  describe("initialize", () => {
    it("loads genes and variants", async () => {
      await searchService.initialize();
      expect(getAllGenes).toHaveBeenCalledTimes(1);
      expect(getGeneVariants).toHaveBeenCalled();
    });

    it("skips re-initialization if already initialized", async () => {
      await searchService.initialize();
      await searchService.initialize();
      expect(getAllGenes).toHaveBeenCalledTimes(1);
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await searchService.initialize();
    });

    it("returns empty array for empty query", async () => {
      const results = await searchService.search("");
      expect(results).toHaveLength(0);
    });

    it("finds gene by exact ID", async () => {
      const results = await searchService.search("RNU4-2");
      expect(results.some((r) => r.type === "gene")).toBe(true);
    });

    it("finds gene by partial ID", async () => {
      const results = await searchService.search("RNU4");
      expect(results.length).toBeGreaterThan(0);
    });

    it("finds gene by name", async () => {
      const results = await searchService.search("U4 small nuclear");
      expect(results.some((r) => r.matchedFields.includes("fullName"))).toBe(
        true,
      );
    });

    it("finds variant by HGVS", async () => {
      const results = await searchService.search("n.45A>G");
      expect(results.some((r) => r.type === "variant")).toBe(true);
    });

    it("respects maxResults option", async () => {
      const results = await searchService.search("RNA", {
        includeGenes: true,
        includeVariants: true,
        maxResults: 2,
      });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("filters by gene only", async () => {
      const results = await searchService.search("RNA", {
        includeGenes: true,
        includeVariants: false,
        maxResults: 10,
      });
      expect(results.every((r) => r.type === "gene")).toBe(true);
    });

    it("filters by variant only", async () => {
      const results = await searchService.search("A", {
        includeGenes: false,
        includeVariants: true,
        maxResults: 10,
      });
      expect(results.every((r) => r.type === "variant")).toBe(true);
    });

    it("sorts by relevance score descending", async () => {
      const results = await searchService.search("RNU");
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          results[i].relevanceScore,
        );
      }
    });
  });

  describe("searchGenes", () => {
    beforeEach(async () => {
      await searchService.initialize();
    });

    it("returns only gene results", async () => {
      const results = await searchService.searchGenes("RNA");
      expect(results.every((g) => "chromosome" in g)).toBe(true);
    });
  });

  describe("searchVariants", () => {
    beforeEach(async () => {
      await searchService.initialize();
    });

    it("returns only variant results", async () => {
      const results = await searchService.searchVariants("A");
      expect(results.every((v) => "position" in v)).toBe(true);
    });
  });

  describe("getSuggestions", () => {
    beforeEach(async () => {
      await searchService.initialize();
    });

    it("returns empty for short queries", async () => {
      const suggestions = await searchService.getSuggestions("R");
      expect(suggestions).toHaveLength(0);
    });

    it("returns suggestions for longer queries", async () => {
      const suggestions = await searchService.getSuggestions("RNU4");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("respects limit parameter", async () => {
      const suggestions = await searchService.getSuggestions("RNA", 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });
});
