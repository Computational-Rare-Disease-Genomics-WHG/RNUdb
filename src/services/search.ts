// Search service for genes and variants
import { getAllGenes, getGeneVariants } from './api';
import type { SnRNAGene, Variant } from '../types';

export interface SearchResult {
  type: 'gene' | 'variant';
  item: SnRNAGene | Variant;
  relevanceScore: number;
  matchedFields: string[];
}

export interface SearchOptions {
  includeGenes: boolean;
  includeVariants: boolean;
  maxResults: number;
}

class SearchService {
  private genes: SnRNAGene[] = [];
  private variants: Map<string, Variant[]> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load all genes
      this.genes = await getAllGenes();

      // Load variants for each gene
      for (const gene of this.genes) {
        try {
          const variants = await getGeneVariants(gene.id);
          this.variants.set(gene.id, variants);
        } catch (error) {
          console.warn(`Could not load variants for ${gene.id}:`, error);
          this.variants.set(gene.id, []);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize search service:', error);
      throw error;
    }
  }

  async search(
    query: string,
    options: SearchOptions = {
      includeGenes: true,
      includeVariants: true,
      maxResults: 20
    }
  ): Promise<SearchResult[]> {
    await this.initialize();

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) return results;

    // Search genes
    if (options.includeGenes) {
      for (const gene of this.genes) {
        const geneResult = this.matchGene(gene, queryLower);
        if (geneResult) {
          results.push(geneResult);
        }
      }
    }

    // Search variants
    if (options.includeVariants) {
      for (const [, variants] of this.variants) {
        for (const variant of variants) {
          const variantResult = this.matchVariant(variant, queryLower);
          if (variantResult) {
            results.push(variantResult);
          }
        }
      }
    }

    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, options.maxResults);
  }

  async searchGenes(query: string): Promise<SnRNAGene[]> {
    const results = await this.search(query, {
      includeGenes: true,
      includeVariants: false,
      maxResults: 10
    });

    return results
      .filter(result => result.type === 'gene')
      .map(result => result.item as SnRNAGene);
  }

  async searchVariants(query: string): Promise<Variant[]> {
    const results = await this.search(query, {
      includeGenes: false,
      includeVariants: true,
      maxResults: 10
    });

    return results
      .filter(result => result.type === 'variant')
      .map(result => result.item as Variant);
  }

  private matchGene(gene: SnRNAGene, query: string): SearchResult | null {
    const matchedFields: string[] = [];
    let relevanceScore = 0;

    // Exact ID match (highest priority)
    if (gene.id.toLowerCase() === query) {
      matchedFields.push('id');
      relevanceScore += 100;
    } else if (gene.id.toLowerCase().includes(query)) {
      matchedFields.push('id');
      relevanceScore += 50;
    }

    // Name match
    if (gene.name.toLowerCase() === query) {
      matchedFields.push('name');
      relevanceScore += 90;
    } else if (gene.name.toLowerCase().includes(query)) {
      matchedFields.push('name');
      relevanceScore += 40;
    }

    // Full name match
    if (gene.fullName.toLowerCase().includes(query)) {
      matchedFields.push('fullName');
      relevanceScore += 30;
    }

    // Description match
    if (gene.description.toLowerCase().includes(query)) {
      matchedFields.push('description');
      relevanceScore += 20;
    }

    // Chromosome match
    if (gene.chromosome.toLowerCase().includes(query)) {
      matchedFields.push('chromosome');
      relevanceScore += 10;
    }

    if (matchedFields.length === 0) return null;

    return {
      type: 'gene',
      item: gene,
      relevanceScore,
      matchedFields
    };
  }

  private matchVariant(variant: Variant, query: string): SearchResult | null {
    const matchedFields: string[] = [];
    let relevanceScore = 0;

    // Exact variant ID match
    if (variant.id.toLowerCase() === query) {
      matchedFields.push('id');
      relevanceScore += 100;
    } else if (variant.id.toLowerCase().includes(query)) {
      matchedFields.push('id');
      relevanceScore += 50;
    }

    // HGVS notation match
    if (variant.hgvs && variant.hgvs.toLowerCase().includes(query)) {
      matchedFields.push('hgvs');
      relevanceScore += 80;
    }

    // Position match (for numeric queries)
    if (/^\d+$/.test(query)) {
      const position = parseInt(query);
      if (variant.position === position || variant.nucleotidePosition === position) {
        matchedFields.push('position');
        relevanceScore += 70;
      }
    }

    // Clinical significance match
    if (variant.clinical_significance && variant.clinical_significance.toLowerCase().includes(query)) {
      matchedFields.push('clinical_significance');
      relevanceScore += 60;
    }

    if (variant.clinvar_significance && variant.clinvar_significance.toLowerCase().includes(query)) {
      matchedFields.push('clinvar_significance');
      relevanceScore += 60;
    }

    // Allele match
    if (variant.ref.toLowerCase() === query || variant.alt.toLowerCase() === query) {
      matchedFields.push('allele');
      relevanceScore += 40;
    }

    // Variant change match (e.g., "A>G", "del", "ins")
    const changePattern = `${variant.ref}>${variant.alt}`.toLowerCase();
    if (changePattern.includes(query) || query.includes(changePattern)) {
      matchedFields.push('change');
      relevanceScore += 50;
    }

    // Consequence match
    if (variant.consequence && variant.consequence.toLowerCase().includes(query)) {
      matchedFields.push('consequence');
      relevanceScore += 30;
    }

    if (matchedFields.length === 0) return null;

    return {
      type: 'variant',
      item: variant,
      relevanceScore,
      matchedFields
    };
  }

  // Get search suggestions based on partial query
  async getSuggestions(query: string, limit = 5): Promise<string[]> {
    await this.initialize();

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase().trim();

    if (queryLower.length < 2) return [];

    // Gene suggestions
    for (const gene of this.genes) {
      if (gene.id.toLowerCase().startsWith(queryLower)) {
        suggestions.add(gene.id);
      }
      if (gene.name.toLowerCase().startsWith(queryLower)) {
        suggestions.add(gene.name);
      }
    }

    // Variant suggestions
    for (const variants of this.variants.values()) {
      for (const variant of variants) {
        if (variant.hgvs && variant.hgvs.toLowerCase().startsWith(queryLower)) {
          suggestions.add(variant.hgvs);
        }
        if (variant.clinical_significance && variant.clinical_significance.toLowerCase().startsWith(queryLower)) {
          suggestions.add(variant.clinical_significance);
        }
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }
}

// Singleton instance
export const searchService = new SearchService();

// Convenience exports
export const {
  search,
  searchGenes,
  searchVariants,
  getSuggestions
} = searchService;