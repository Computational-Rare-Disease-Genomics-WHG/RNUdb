import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiService } from "./api";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getGeneStructure", () => {
    it("should return first structure when structures exist", async () => {
      const mockStructures = [
        { id: "struct-1", gene_id: "RNU4-2", nucleotides: [], base_pairs: [] },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockStructures),
      });

      const result = await apiService.getGeneStructure("RNU4-2");

      expect(result).toEqual(mockStructures[0]);
      expect(mockFetch).toHaveBeenCalledWith("/api/genes/RNU4-2/structures", {
        credentials: "include",
      });
    });

    it("should return null when no structures exist", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve([]),
      });

      const result = await apiService.getGeneStructure("RNU4-2");

      expect(result).toBeNull();
    });

    it("should return null when API returns 404", async () => {
      mockFetch.mockRejectedValueOnce(
        new Error("API request failed: 404 Not Found"),
      );

      const result = await apiService.getGeneStructure("RNU4-2");

      expect(result).toBeNull();
    });

    it("should return null when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await apiService.getGeneStructure("RNU4-2");

      expect(result).toBeNull();
    });
  });

  describe("getGenePDB", () => {
    it("should return PDB data when it exists", async () => {
      const mockPDB = { geneId: "RNU4-2", pdbData: "mock-pdb-data" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockPDB),
      });

      const result = await apiService.getGenePDB("RNU4-2");

      expect(result).toEqual(mockPDB);
    });

    it("should return null when API returns 404", async () => {
      mockFetch.mockRejectedValueOnce(
        new Error("API request failed: 404 Not Found"),
      );

      const result = await apiService.getGenePDB("RNU4-2");

      expect(result).toBeNull();
    });

    it("should return null when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await apiService.getGenePDB("RNU4-2");

      expect(result).toBeNull();
    });
  });

  describe("getAllGenes", () => {
    it("should return list of genes", async () => {
      const mockGenes = [
        {
          id: "RNU4-2",
          name: "RNU4-2",
          chromosome: "12",
          start: 100,
          end: 200,
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockGenes),
      });

      const result = await apiService.getAllGenes();

      expect(result).toEqual(mockGenes);
    });

    it("should throw error when API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(apiService.getAllGenes()).rejects.toThrow();
    });
  });

  describe("getGene", () => {
    it("should return gene data", async () => {
      const mockGene = {
        id: "RNU4-2",
        name: "RNU4-2",
        chromosome: "12",
        start: 100,
        end: 200,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockGene),
      });

      const result = await apiService.getGene("RNU4-2");

      expect(result).toEqual(mockGene);
    });

    it("should throw error when gene not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(apiService.getGene("INVALID")).rejects.toThrow();
    });
  });

  describe("getGeneVariants", () => {
    it("should return variants for a gene", async () => {
      const mockVariants = [
        { id: "var-1", geneId: "RNU4-2", position: 150, ref: "A", alt: "G" },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockVariants),
      });

      const result = await apiService.getGeneVariants("RNU4-2");

      expect(result).toEqual(mockVariants);
    });

    it("should return empty array when no variants", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve([]),
      });

      const result = await apiService.getGeneVariants("RNU4-2");

      expect(result).toEqual([]);
    });
  });

  describe("getGeneLiterature", () => {
    it("should return literature for a gene", async () => {
      const mockLiterature = [
        {
          id: "lit-1",
          title: "Test Paper",
          authors: "Test Author",
          journal: "Test Journal",
          year: 2024,
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockLiterature),
      });

      const result = await apiService.getGeneLiterature("RNU4-2");

      expect(result).toEqual(mockLiterature);
    });
  });
});
