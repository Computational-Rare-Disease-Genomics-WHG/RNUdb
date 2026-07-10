import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useNucleotideManager } from "./useNucleotideManager";
import type { RNAData } from "@/types";

const makeInitialData = (): RNAData => ({
  id: "test",
  geneId: "test",
  name: "Test",
  nucleotides: [
    { id: 1, base: "A", x: 100, y: 100 },
    { id: 2, base: "U", x: 200, y: 100 },
    { id: 3, base: "G", x: 100, y: 200 },
  ],
  base_pairs: [{ from_pos: 1, to_pos: 2 }],
});

describe("useNucleotideManager", () => {
  describe("toggleNucleotideInSelection", () => {
    it("adds a nucleotide to an empty selection", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.toggleNucleotideInSelection(1);
      });

      expect(result.current.selectedNucleotides).toEqual([1]);
    });

    it("adds a nucleotide to an existing selection", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.toggleNucleotideInSelection(1);
        result.current.toggleNucleotideInSelection(2);
      });

      expect(result.current.selectedNucleotides).toEqual([1, 2]);
    });

    it("removes a nucleotide if already selected", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.toggleNucleotideInSelection(1);
        result.current.toggleNucleotideInSelection(2);
        result.current.toggleNucleotideInSelection(1);
      });

      expect(result.current.selectedNucleotides).toEqual([2]);
    });

    it("toggles the same nucleotide off then on", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.toggleNucleotideInSelection(1);
      });
      expect(result.current.selectedNucleotides).toEqual([1]);

      act(() => {
        result.current.toggleNucleotideInSelection(1);
      });
      expect(result.current.selectedNucleotides).toEqual([]);

      act(() => {
        result.current.toggleNucleotideInSelection(1);
      });
      expect(result.current.selectedNucleotides).toEqual([1]);
    });

    it("does not affect currentNucleotide", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.setCurrentNucleotide(1);
        result.current.toggleNucleotideInSelection(2);
      });

      expect(result.current.currentNucleotide).toBe(1);
      expect(result.current.selectedNucleotides).toEqual([2]);
    });
  });

  describe("existing selection behavior unchanged", () => {
    it("setSelectedNucleotides replaces the array", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.setSelectedNucleotides([1, 2, 3]);
      });

      expect(result.current.selectedNucleotides).toEqual([1, 2, 3]);

      act(() => {
        result.current.setSelectedNucleotides([1]);
      });

      expect(result.current.selectedNucleotides).toEqual([1]);
    });

    it("removeNucleotide removes from selection if present", () => {
      const { result } = renderHook(() => useNucleotideManager(makeInitialData()));

      act(() => {
        result.current.setSelectedNucleotides([1, 2]);
        result.current.removeNucleotide(1);
      });

      expect(result.current.selectedNucleotides).toEqual([2]);
    });
  });
});
