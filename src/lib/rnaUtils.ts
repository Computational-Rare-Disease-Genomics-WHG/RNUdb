// src/lib/rnaUtils.ts
import type { Nucleotide } from '../types';

export const isWatsonCrickPair = (base1: string, base2: string): boolean => {
  return (
    (base1 === 'G' && base2 === 'C') ||
    (base1 === 'C' && base2 === 'G') ||
    (base1 === 'A' && base2 === 'U') ||
    (base1 === 'U' && base2 === 'A')
  );
};

export const findNucleotideById = (nucleotides: Nucleotide[], id: number): Nucleotide | undefined => {
  return nucleotides.find(n => n.id === id);
};