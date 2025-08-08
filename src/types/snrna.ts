import type { RNAData } from './rna';
import type { SnRNAGeneData } from '../data/snRNAData';
import type { Variant } from '../data/variantData';

export interface SGEData {
  [key: string]: any;
}

export interface SnRNADataset {
  id: string;
  metadata: SnRNAGeneData;
  structure?: RNAData;
  variants?: Variant[];
  sgeData?: SGEData[];
}