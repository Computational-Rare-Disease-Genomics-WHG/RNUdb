// Structure data utilities
import type { RNAStructure } from '../types';
import { getGeneStructure, getGenePDB } from '../services/api';

export const getRNAStructure = async (geneId: string): Promise<RNAStructure | null> => {
  try {
    return await getGeneStructure(geneId);
  } catch (error) {
    console.error(`Error fetching structure for ${geneId}:`, error);
    return null;
  }
};

export const getPDBStructure = async (geneId: string): Promise<{ geneId: string; pdbData: string } | null> => {
  try {
    const result = await getGenePDB(geneId);
    return result;
  } catch (error) {
    console.error(`Error fetching PDB for ${geneId}:`, error);
    return null;
  }
};

export const getRNAStructureById = async (structureId: string): Promise<RNAStructure | null> => {
  try {
    // Since we don't have a direct endpoint for structure by ID, 
    // we'd need to implement this differently or add it to the API
    // For now, just return null as this function might not be used
    return null;
  } catch (error) {
    console.error(`Error fetching structure ${structureId}:`, error);
    return null;
  }
};
