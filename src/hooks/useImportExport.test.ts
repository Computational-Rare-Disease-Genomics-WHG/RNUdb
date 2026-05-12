import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useImportExport } from "./useImportExport";
import type { RNAData } from "@/types";

describe("useImportExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  describe("exportToJSON", () => {
    it("exports RNA data to JSON string", () => {
      const { result } = renderHook(() => useImportExport());
      const rnaData: RNAData = {
        id: "test-1",
        geneId: "RNU4-2",
        name: "Test Structure",
        nucleotides: [
          { id: 1, base: "A", x: 100, y: 100 },
          { id: 2, base: "U", x: 120, y: 90 },
        ],
        base_pairs: [{ from_pos: 1, to_pos: 2 }],
      };

      const json = result.current.exportToJSON(rnaData);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe("test-1");
      expect(parsed.geneId).toBe("RNU4-2");
      expect(parsed.name).toBe("Test Structure");
      expect(parsed.nucleotides).toHaveLength(2);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.version).toBe("1.0.0");
      expect(parsed.metadata.source).toBe("RNAdb Editor");
    });
  });

  describe("importFromJSON", () => {
    it("parses valid JSON", () => {
      const { result } = renderHook(() => useImportExport());
      const validJson = JSON.stringify({
        id: "import-1",
        name: "Imported Structure",
        nucleotides: [{ id: 1, base: "A", x: 100, y: 100 }],
        base_pairs: [],
      });

      const imported = result.current.importFromJSON(validJson);
      expect(imported).not.toBeNull();
      expect(imported?.id).toBe("import-1");
    });

    it("returns null for invalid JSON", () => {
      const { result } = renderHook(() => useImportExport());
      const invalidJson = "not valid json";

      const imported = result.current.importFromJSON(invalidJson);
      expect(imported).toBeNull();
    });

    it("returns null for missing required fields", () => {
      const { result } = renderHook(() => useImportExport());
      const incompleteJson = JSON.stringify({
        id: "import-1",
        name: "Test",
        // missing nucleotides and base_pairs
      });

      const imported = result.current.importFromJSON(incompleteJson);
      expect(imported).toBeNull();
    });

    it("validates nucleotide structure", () => {
      const { result } = renderHook(() => useImportExport());
      const invalidNucJson = JSON.stringify({
        id: "import-1",
        name: "Test",
        nucleotides: [
          { id: "not-a-number", x: 100, y: 100 }, // invalid id
        ],
        base_pairs: [],
      });

      const imported = result.current.importFromJSON(invalidNucJson);
      expect(imported).toBeNull();
    });

    it("validates base pair structure", () => {
      const { result } = renderHook(() => useImportExport());
      const invalidBpJson = JSON.stringify({
        id: "import-1",
        name: "Test",
        nucleotides: [{ id: 1, base: "A", x: 100, y: 100 }],
        base_pairs: [
          { from_pos: "not-a-number", to_pos: 2 }, // invalid from_pos
        ],
      });

      const imported = result.current.importFromJSON(invalidBpJson);
      expect(imported).toBeNull();
    });

    it("handles structural features validation", () => {
      const { result } = renderHook(() => useImportExport());
      const validWithFeatures = JSON.stringify({
        id: "import-1",
        name: "Test",
        nucleotides: [{ id: 1, base: "A", x: 100, y: 100 }],
        base_pairs: [],
        structural_features: [
          {
            id: "feature-1",
            feature_type: "hairpin",
            nucleotide_ids: [1],
            label_text: "Test Feature",
          },
        ],
      });

      const imported = result.current.importFromJSON(validWithFeatures);
      expect(imported).not.toBeNull();
      expect(imported?.structural_features).toHaveLength(1);
    });
  });

  describe("localStorage operations", () => {
    it("saves to localStorage", () => {
      const { result } = renderHook(() => useImportExport());
      const rnaData: RNAData = {
        id: "save-test",
        geneId: "RNU4-2",
        name: "Save Test",
        nucleotides: [],
        base_pairs: [],
      };

      const key = result.current.saveToLocalStorage(rnaData);
      expect(key).toBe("rna_editor_save-test");
      expect(localStorage.getItem("rna_editor_save-test")).toBeTruthy();
    });

    it("loads from localStorage", () => {
      const { result } = renderHook(() => useImportExport());
      const testData = {
        id: "load-test",
        geneId: "RNU4-2",
        name: "Load Test",
        nucleotides: [{ id: 1, base: "A", x: 100, y: 100 }],
        base_pairs: [],
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("rna_editor_load-test", JSON.stringify(testData));

      const loaded = result.current.loadFromLocalStorage(
        "rna_editor_load-test",
      );
      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe("load-test");
      expect(loaded?.name).toBe("Load Test");
    });

    it("returns null for missing key", () => {
      const { result } = renderHook(() => useImportExport());
      const loaded = result.current.loadFromLocalStorage("non-existent");
      expect(loaded).toBeNull();
    });

    it("lists saved structures", () => {
      const { result } = renderHook(() => useImportExport());

      // Add some test data
      localStorage.setItem(
        "rna_editor_test-1",
        JSON.stringify({
          name: "Test 1",
          savedAt: "2024-01-01",
        }),
      );
      localStorage.setItem(
        "rna_editor_test-2",
        JSON.stringify({
          name: "Test 2",
          savedAt: "2024-01-02",
        }),
      );
      localStorage.setItem("other_key", JSON.stringify({}));

      const saved = result.current.listSavedStructures();
      expect(saved).toHaveLength(2);
    });

    it("deletes saved structure", () => {
      const { result } = renderHook(() => useImportExport());
      localStorage.setItem(
        "rna_editor_delete-test",
        JSON.stringify({ name: "Test" }),
      );

      const deleted = result.current.deleteSavedStructure(
        "rna_editor_delete-test",
      );
      expect(deleted).toBe(true);
      expect(localStorage.getItem("rna_editor_delete-test")).toBeNull();
    });
  });
});
