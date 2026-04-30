import type { SnRNAGene, Variant, Literature, LiteratureCounts, RNAStructure, PDBStructure } from '../types';

// Default API base URL (hardcoded to localhost backend mounted at /api)
const API_BASE_URL = '/api';

class ApiService {

  private async fetchFromApi(endpoint: string): Promise {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('application/vnd.api+json')) {
        return await response.json();
      }
      // Fallback to plain text (e.g., PDB data or other text responses)
      return (await response.text()) as unknown;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }
  // Gene endpoints
  async getAllGenes(): Promise {
    return this.fetchFromApi('/genes');
  }

  async getGene(geneId: string): Promise {
    return this.fetchFromApi(`/genes/${geneId}`);
  }

  // Variant endpoints
  async getGeneVariants(geneId: string): Promise {
    return this.fetchFromApi(`/genes/${geneId}/variants`);
  }

  async getVariant(variantId: string): Promise {
    return this.fetchFromApi(`/variants/${variantId}`);
  }

  // Literature endpoints
  async getAllLiterature(): Promise {
    return this.fetchFromApi('/literature');
  }

  async getGeneLiterature(geneId: string): Promise {
    return this.fetchFromApi(`/genes/${geneId}/literature`);
  }

  // Structure endpoints
  async getGeneStructure(geneId: string): Promise {
    return this.fetchFromApi(`/genes/${geneId}/structure`);
  }

  async getGenePDB(geneId: string): Promise {
    return this.fetchFromApi(`/genes/${geneId}/pdb`);
  }

  async getLiteratureCounts(): Promise {
    return this.fetchFromApi('/literature-counts');
  }


}

// Create and export a singleton instance
export const apiService = new ApiService();

export const getAllGenes = () => apiService.getAllGenes();
export const getGene = (geneId: string) => apiService.getGene(geneId);
export const getGeneVariants = (geneId: string) => apiService.getGeneVariants(geneId);
export const getVariant = (variantId: string) => apiService.getVariant(variantId);
export const getAllLiterature = () => apiService.getAllLiterature();
export const getGeneLiterature = (geneId: string) => apiService.getGeneLiterature(geneId);
export const getGeneStructure = (geneId: string) => apiService.getGeneStructure(geneId);
export const getGenePDB = (geneId: string) => apiService.getGenePDB(geneId);
export const getLiteratureCounts = () => apiService.getLiteratureCounts();
export const getMe = () => apiService.fetchFromApi('/auth/me');
export const logout = () => fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
