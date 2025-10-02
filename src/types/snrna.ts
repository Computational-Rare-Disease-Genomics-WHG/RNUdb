import type { RNAStructure, SnRNAGene, Variant, Literature, SGEDataset } from './rna';

export interface SnRNADataset {
  id: string;
  gene: SnRNAGene;
  structure?: RNAStructure;
  variants?: Variant[];
  literature?: Literature[];
  sgeData?: SGEDataset;
}