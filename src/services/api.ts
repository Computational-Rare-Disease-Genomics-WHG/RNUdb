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
  private async fetchFromApi<T>(
    endpoint: string,
    options?: { method?: string; signal?: AbortSignal },
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
        method: options?.method,
        signal: options?.signal,
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

  async getAllGenes(signal?: AbortSignal): Promise<SnRNAGene[]> {
    return this.fetchFromApi<SnRNAGene[]>("/genes", { signal });
  }

  async getGene(geneId: string): Promise<SnRNAGene> {
    return this.fetchFromApi<SnRNAGene>(`/genes/${geneId}`);
  }

  async getGeneVariants(geneId: string, signal?: AbortSignal): Promise<Variant[]> {
    return this.fetchFromApi<Variant[]>(`/genes/${geneId}/variants`, { signal });
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

  async logout(): Promise<void> {
    await this.fetchFromApi<void>("/auth/logout", { method: "POST" });
  }

  async getPendingUsers(): Promise<any[]> {
    return this.fetchFromApi<any[]>("/users/pending");
  }

  async getPendingApprovals(): Promise<any[]> {
    return this.fetchFromApi<any[]>("/approvals?status=pending");
  }

  async getBedTracks(geneId: string): Promise<any> {
    return this.fetchFromApi<any>(`/genes/${geneId}/bed-tracks`);
  }

  async getVariantClassifications(geneId: string): Promise<any> {
    return this.fetchFromApi<any>(`/genes/${geneId}/variant-classifications`);
  }

  async getDistinctDiseaseTypes(): Promise<string[]> {
    return this.fetchFromApi<string[]>("/variants/disease-types");
  }

  async getGeneDistinctDiseaseTypes(geneId: string): Promise<string[]> {
    return this.fetchFromApi<string[]>(`/genes/${geneId}/disease-types`);
  }

  async getDistinctClinicalSignificances(): Promise<string[]> {
    return this.fetchFromApi<string[]>("/variants/clinical-significances");
  }
}

export const apiService = new ApiService();

export const getAllGenes = (signal?: AbortSignal) => apiService.getAllGenes(signal);
export const getGene = (geneId: string) => apiService.getGene(geneId);
export const getGeneVariants = (geneId: string, signal?: AbortSignal) =>
  apiService.getGeneVariants(geneId, signal);
export const getVariant = (variantId: string) => apiService.getVariant(variantId);
export const getAllLiterature = () => apiService.getAllLiterature();
export const getGeneLiterature = (geneId: string) =>
  apiService.getGeneLiterature(geneId);
export const getGeneStructure = (geneId: string) => apiService.getGeneStructure(geneId);
export const getGenePDB = (geneId: string) => apiService.getGenePDB(geneId);
export const getLiteratureCounts = () => apiService.getLiteratureCounts();
export const getMe = () => apiService.getMe();
export const logout = () => apiService.logout();
export const getPendingUsers = () => apiService.getPendingUsers();
export const getPendingApprovals = () => apiService.getPendingApprovals();
export const getBedTracks = (geneId: string) => apiService.getBedTracks(geneId);
export const getVariantClassifications = (geneId: string) =>
  apiService.getVariantClassifications(geneId);
export const getDistinctDiseaseTypes = () => apiService.getDistinctDiseaseTypes();
export const getGeneDistinctDiseaseTypes = (geneId: string) =>
  apiService.getGeneDistinctDiseaseTypes(geneId);
export const getDistinctClinicalSignificances = () =>
  apiService.getDistinctClinicalSignificances();
