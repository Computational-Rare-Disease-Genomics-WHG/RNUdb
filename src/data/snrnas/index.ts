import { rnu42Dataset } from './rnu4-2';
import { rnu11Dataset } from './rnu1-1';
import { rnu21Dataset } from './rnu2-1';
import type { SnRNADataset } from '../../types/snrna';

export const snRNARegistry: Record<string, SnRNADataset> = {
  'RNU4-2': rnu42Dataset,
  'RNU1-1': rnu11Dataset,
  'RNU2-1': rnu21Dataset,
};

export const getSnRNADataset = (id: string): SnRNADataset | undefined => {
  return snRNARegistry[id];
};

export const getAllSnRNAIds = (): string[] => {
  return Object.keys(snRNARegistry);
};