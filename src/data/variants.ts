// Variant data utilities
import { getGeneVariants, getVariant } from '../services/api';
import type { Variant } from '../types';

export const getVariants = async (geneId: string): Promise<Variant[]> => {
  try {
    return await getGeneVariants(geneId);
  } catch (error) {
    console.error(`Error fetching variants for ${geneId}:`, error);
    return [];
  }
};

export const getVariantById = async (variantId: string): Promise<Variant | null> => {
  try {
    return await getVariant(variantId);
  } catch (error) {
    console.error(`Error fetching variant ${variantId}:`, error);
    return null;
  }
};
