// Literature data utilities
import { getAllLiterature, getGeneLiterature } from '../services/api';
import type { Literature } from '../types';

export const getLiterature = async (geneId?: string): Promise<Literature[]> => {
  try {
    if (!geneId) {
      return await getAllLiterature();
    }
    
    return await getGeneLiterature(geneId);
  } catch (error) {
    console.error(`Error fetching literature for ${geneId || 'all'}:`, error);
    return [];
  }
};

export const getPaperByPmid = async (pmid: string): Promise<Literature | null> => {
  try {
    const allLiterature = await getAllLiterature();
    return allLiterature.find(paper => paper.pmid === pmid) || null;
  } catch (error) {
    console.error(`Error fetching paper with PMID ${pmid}:`, error);
    return null;
  }
};
