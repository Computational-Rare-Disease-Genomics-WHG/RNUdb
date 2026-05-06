// Literature data utilities
import { getAllLiterature, getGeneLiterature } from "../services/api";
import type { Literature } from "../types";

export const getLiterature = async (geneId?: string): Promise<Literature[]> => {
  try {
    if (!geneId) {
      return await getAllLiterature();
    }

    return await getGeneLiterature(geneId);
  } catch (error) {
    console.error(`Error fetching literature for ${geneId || "all"}:`, error);
    return [];
  }
};

export const getPaperById = async (id: string): Promise<Literature | null> => {
  try {
    const allLiterature: Literature[] = await getAllLiterature();
    return allLiterature.find((paper: Literature) => paper.id === id) || null;
  } catch (error) {
    console.error(`Error fetching paper with ID ${id}:`, error);
    return null;
  }
};
