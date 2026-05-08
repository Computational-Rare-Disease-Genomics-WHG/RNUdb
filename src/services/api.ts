import type {
  SnRNAGene,
  Variant,
  Literature,
  LiteratureCounts,
  RNAStructure,
  PDBStructure,
} from "../types";

const API_BASE_URL = "/api";

class ApiService {
  private async fetchFromApi<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }
      const contentType = response.headers.get("content-type") || "";
      if (
        contentType.includes("application/json") ||
        contentType.includes("application/vnd.api+json")
      ) {
        return (await response.json()) as T;
      }
      return (await response.text()) as unknown as T;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async getAllGenes(): Promise<SnRNAGene[]> {
    return this.fetchFromApi<SnRNAGene[]>("/genes");
  }

  async getGene(geneId: string): Promise<SnRNAGene> {
    return this.fetchFromApi<SnRNAGene>(`/genes/${geneId}`);
  }

  async getGeneVariants(geneId: string): Promise<Variant[]> {
    return this.fetchFromApi<Variant[]>(`/genes/${geneId}/variants`);
  }

  async getVariant(variantId: string): Promise<Variant> {
    return this.fetchFromApi<Variant>(`/variants/${variantId}`);
  }

  async getAllLiterature(): Promise<Literature[]> {
    return this.fetchFromApi<Literature[]>("/literature");
  }

  async getGeneLiterature(geneId: string): Promise<Literature[]> {
    return this.fetchFromApi<Literature[]>(`/genes/${geneId}/literature`);
  }

  async getGeneStructure(geneId: string): Promise<RNAStructure | null> {
    try {
      const structures = await this.fetchFromApi<RNAStructure[]>(
        `/genes/${geneId}/structures`,
      );
      return structures.length > 0 ? structures[0] : null;
    } catch {
      return null;
    }
  }

  async getGenePDB(geneId: string): Promise<PDBStructure | null> {
    try {
      return await this.fetchFromApi<PDBStructure>(`/genes/${geneId}/pdb`);
    } catch {
      return null;
    }
  }

  async getLiteratureCounts(): Promise<LiteratureCounts[]> {
    return this.fetchFromApi<LiteratureCounts[]>("/literature-counts");
  }

  async getMe(): Promise<any> {
    return this.fetchFromApi<any>("/auth/me");
  }

  async getDistinctDiseaseTypes(): Promise<string[]> {
    return this.fetchFromApi<string[]>("/variants/disease-types");
  }

  async getDistinctClinicalSignificances(): Promise<string[]> {
    return this.fetchFromApi<string[]>("/variants/clinical-significances");
  }
}

export const apiService = new ApiService();

export const getAllGenes = () => apiService.getAllGenes();
export const getGene = (geneId: string) => apiService.getGene(geneId);
export const getGeneVariants = (geneId: string) =>
  apiService.getGeneVariants(geneId);
export const getVariant = (variantId: string) =>
  apiService.getVariant(variantId);
export const getAllLiterature = () => apiService.getAllLiterature();
export const getGeneLiterature = (geneId: string) =>
  apiService.getGeneLiterature(geneId);
export const getGeneStructure = (geneId: string) =>
  apiService.getGeneStructure(geneId);
export const getGenePDB = (geneId: string) => apiService.getGenePDB(geneId);
export const getLiteratureCounts = () => apiService.getLiteratureCounts();
export const getMe = () => apiService.getMe();
export const logout = () =>
  fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
export const getDistinctDiseaseTypes = () =>
  apiService.getDistinctDiseaseTypes();
export const getDistinctClinicalSignificances = () =>
  apiService.getDistinctClinicalSignificances();
