// src/types/rna.ts
export interface Nucleotide {
  id: number;
  base: 'A' | 'U' | 'G' | 'C';
  x: number;
  y: number;
}

export interface BasePair {
  from: number;
  to: number;
}

export interface AnnotationLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color?: string;
}

export interface RNAData {
  id: string;
  name: string;
  nucleotides: Nucleotide[];
  basePairs: BasePair[];
  canvasWidth?: number;
  canvasHeight?: number;
  annotations?: AnnotationLabel[];
}

export interface OverlayData {
  [nucleotideId: number]: number;
}