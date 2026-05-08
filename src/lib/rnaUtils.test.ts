import { describe, it, expect } from "vitest";
import type { Nucleotide } from "@/types";
import { isWatsonCrickPair, findNucleotideById } from "./rnaUtils";

describe("isWatsonCrickPair", () => {
  it("returns true for G-C pair", () => {
    expect(isWatsonCrickPair("G", "C")).toBe(true);
    expect(isWatsonCrickPair("C", "G")).toBe(true);
  });

  it("returns true for A-U pair", () => {
    expect(isWatsonCrickPair("A", "U")).toBe(true);
    expect(isWatsonCrickPair("U", "A")).toBe(true);
  });

  it("returns false for non-Watson-Crick pairs", () => {
    expect(isWatsonCrickPair("G", "U")).toBe(false);
    expect(isWatsonCrickPair("A", "G")).toBe(false);
    expect(isWatsonCrickPair("C", "A")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(isWatsonCrickPair("g", "c")).toBe(false);
    expect(isWatsonCrickPair("G", "c")).toBe(false);
  });
});

describe("findNucleotideById", () => {
  const nucleotides: Nucleotide[] = [
    { id: 1, base: "A", x: 100, y: 100 },
    { id: 2, base: "U", x: 120, y: 90 },
    { id: 3, base: "G", x: 140, y: 100 },
  ];

  it("returns nucleotide when found", () => {
    const result = findNucleotideById(nucleotides, 1);
    expect(result).toEqual({ id: 1, base: "A", x: 100, y: 100 });
  });

  it("returns undefined when not found", () => {
    const result = findNucleotideById(nucleotides, 99);
    expect(result).toBeUndefined();
  });

  it("returns first match for duplicate ids", () => {
    const dupNucleotides: Nucleotide[] = [
      { id: 1, base: "A", x: 100, y: 100 },
      { id: 1, base: "U", x: 120, y: 90 },
    ];
    const result = findNucleotideById(dupNucleotides, 1);
    expect(result?.base).toBe("A");
  });

  it("handles empty array", () => {
    const result = findNucleotideById([], 1);
    expect(result).toBeUndefined();
  });
});
