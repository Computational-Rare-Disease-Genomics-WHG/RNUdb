import type { SnRNAGene, Variant, Literature, RNAStructure, PDBStructure } from '../types';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {

  private async fetchFromApi<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }
  // Gene endpoints
  async getAllGenes(): Promise<SnRNAGene[]> {
    return this.fetchFromApi<SnRNAGene[]>('/genes');
  }

  async getGene(geneId: string): Promise<SnRNAGene> {
    return this.fetchFromApi<SnRNAGene>(`/genes/${geneId}`);
  }

  // Variant endpoints
  async getGeneVariants(geneId: string): Promise<Variant[]> {
    return this.fetchFromApi<Variant[]>(`/genes/${geneId}/variants`);
  }

  async getVariant(variantId: string): Promise<Variant> {
    return this.fetchFromApi<Variant>(`/variants/${variantId}`);
  }

  // Literature endpoints
  async getAllLiterature(): Promise<Literature[]> {
    return this.fetchFromApi<Literature[]>('/literature');
  }

  async getGeneLiterature(geneId: string): Promise<Literature[]> {
    return this.fetchFromApi<Literature[]>(`/genes/${geneId}/literature`);
  }

  // Structure endpoints
  async getGeneStructure(geneId: string): Promise<RNAStructure> {
    return this.fetchFromApi<RNAStructure>(`/genes/${geneId}/structure`);
  }

  async getGenePDB(geneId: string): Promise<PDBStructure> {
    return this.fetchFromApi<PDBStructure>(`/genes/${geneId}/pdb`);
  }


}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export individual functions for easier migration
export const getAllGenes = () => apiService.getAllGenes();
export const getGene = (geneId: string) => apiService.getGene(geneId);
export const getGeneVariants = (geneId: string) => apiService.getGeneVariants(geneId);
export const getVariant = (variantId: string) => apiService.getVariant(variantId);
export const getAllLiterature = () => apiService.getAllLiterature();
export const getGeneLiterature = (geneId: string) => apiService.getGeneLiterature(geneId);
export const getGeneStructure = (geneId: string) => apiService.getGeneStructure(geneId);
export const getGenePDB = (geneId: string) => apiService.getGenePDB(geneId);