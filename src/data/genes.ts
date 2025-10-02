// Gene data utilities
import { getGene, getAllGenes } from '../services/api';
import type { SnRNAGene } from '../types';

export const getAllSnRNAIds = async (): Promise<string[]> => {
  try {
    const genes = await getAllGenes();
    return genes.map(gene => gene.id);
  } catch (error) {
    console.error('Error fetching gene IDs:', error);
    return ['RNU4-2']; // Fallback
  }
};

export const getGeneData = async (geneId: string): Promise<SnRNAGene | null> => {
  try {
    return await getGene(geneId);
  } catch (error) {
    console.error(`Error fetching gene data for ${geneId}:`, error);
    return null;
  }
};
