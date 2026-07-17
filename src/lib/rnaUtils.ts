// src/lib/rnaUtils.ts
import type { Nucleotide } from "../types";

export const isWatsonCrickPair = (base1: string, base2: string): boolean => {
  return (
    (base1 === "G" && base2 === "C") ||
    (base1 === "C" && base2 === "G") ||
    (base1 === "A" && base2 === "U") ||
    (base1 === "U" && base2 === "A")
  );
};

export const findNucleotideById = (
  nucleotides: Nucleotide[],
  id: number,
): Nucleotide | undefined => {
  return nucleotides.find((n) => n.id === id);
};

export function getAffectedNucleotideIds(
  hgvs: string | undefined,
  nucleotidePosition: number,
): number[] {
  if (!hgvs) return [nucleotidePosition];

  // Multi-position deletion: n.X_Ydel
  const multiDel = hgvs.match(/^n\.(\d+)_(\d+)del/);
  if (multiDel) {
    const start = Number(multiDel[1]);
    const end = Number(multiDel[2]);
    const ids: number[] = [];
    for (let i = start; i <= end; i++) ids.push(i);
    return ids;
  }

  // Single-position deletion: n.Xdel
  const singleDel = hgvs.match(/^n\.(\d+)del/);
  if (singleDel) return [Number(singleDel[1])];

  // Insertion: n.X_Yins — affects both flanking positions
  const ins = hgvs.match(/^n\.(\d+)_(\d+)ins/);
  if (ins) return [Number(ins[1]), Number(ins[2])];

  // Duplication: n.Xdup
  const dup = hgvs.match(/^n\.(\d+)dup/);
  if (dup) return [Number(dup[1])];

  // SNV or other — single position
  return [nucleotidePosition];
}
