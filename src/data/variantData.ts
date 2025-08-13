import type { OverlayData } from '../types';

export interface Variant {
  id: string;
  position?: string;
  ref?: string;
  alt?: string;
  consequence?: string;
  frequency?: string;
  gnomad_frequency?: string;
  clinvar_significance?: string;
  clinical?: string;
  pmid?: string;
  // SGE Data fields
  variant_type?: string;
  sub_type?: string;
  nucleotide?: number | null;
  hgvs?: string | null;
  function_score?: number | null;
  pvalues?: number | null;
  qvalues?: number | null;
  depletion_group?: string | null;
  category?: string | null;
  aou_ac?: number | null;
  aou_hom?: number | null;
  ukbb_ac?: number | null;
  ukbb_hom?: number | null;
  cadd_score?: number | null;
}

// Clinical variant data (original variantData)
export const clinicalVariants: Variant[] = [
  {
    id: 'rs1234567',
    position: '12:6649001',
    ref: 'A',
    alt: 'G',
    consequence: 'synonymous_variant',
    frequency: '0.0012',
    gnomad_frequency: '0.0015',
    clinvar_significance: 'Benign',
    clinical: 'Benign',
    pmid: '12345678'
  },
  {
    id: 'rs2345678',
    position: '12:6649045',
    ref: 'C',
    alt: 'T',
    consequence: 'structural_variant',
    frequency: '0.0008',
    gnomad_frequency: '0.0006',
    clinvar_significance: 'Pathogenic',
    clinical: 'Pathogenic',
    pmid: '23456789'
  },
  {
    id: 'rs3456789',
    position: '12:6649078',
    ref: 'G',
    alt: 'A',
    consequence: 'regulatory_variant',
    frequency: '0.0034',
    gnomad_frequency: '0.0041',
    clinvar_significance: 'Uncertain significance',
    clinical: 'VUS',
    pmid: '34567890'
  },
  {
    id: 'rs4567890',
    position: '12:6649112',
    ref: 'T',
    alt: 'C',
    consequence: 'splice_site_variant',
    frequency: '0.0001',
    gnomad_frequency: '0.0002',
    clinvar_significance: 'Likely pathogenic',
    clinical: 'Likely Pathogenic',
    pmid: '45678901'
  },
  {
    id: 'rs5678901',
    position: '12:6649087',
    ref: 'A',
    alt: 'T',
    consequence: 'missense_variant',
    frequency: '0.0003',
    gnomad_frequency: '0.0004',
    clinvar_significance: 'Benign',
    clinical: 'Benign',
    pmid: '56789012'
  }
];


// Generate gnomAD variants for browser display
export const generateGnomadVariants = (count: number) => {
  const variants = [];
  for (let i = 0; i < count; i++) {
    const position = 6648956 + Math.floor(Math.random() * 145); // Within RNU4-2 range
    variants.push({
      variant_id: `rs${1000000 + i}`,
      pos: position,
      allele_freq: Math.random() * 0.01, // Random frequency up to 1%
      consequence: 'synonymous_variant',
      clinical_significance: null,
      isHighlighted: false
    });
  }
  return variants;
};

export const gnomadVariants = generateGnomadVariants(40);

export const clinVarOverlayData: OverlayData = {
  5: 0.5,      // benign
  6: 0.25,     // VUS
  7: 1,        // pathogenic
  8: 0.5,      // benign
  9: 0.25,     // VUS
  10: 1,       // pathogenic
  5770: 0.5,   // benign
  5779: 0.25,  // VUS
  13: 1,       // pathogenic
  14: 0.5,     // benign
  15: 0.25,    // VUS
  16: 1,       // pathogenic
  17: 1,       // pathogenic
  18: 1,       // pathogenic
  19: 1,       // pathogenic
  20: 1,       // pathogenic
  62: 1,     // deleterious
  63: 1,     // deleterious
  64: 1,     // deleterious
  65: 1,     // deleterious
  66: 1,     // deleterious
  67: 1,     // deleterious
  68: 1,     // deleterious
  69: 1,     // deleterious
  70: 1      // deleterious
};

export const gnomadOverlayData: OverlayData = {
  5761: 0.95,
  5762: 0.12,
  5763: 0.45,
  5764: 0.78,
  5: 0.03,
  6: 0.67,
  7: 0.23,
  8: 0.89,
  9: 0.34,
  10: 0.56,
  5770: 0.08,
  5779: 0.72,
  13: 0.41,
  14: 0.91,
  15: 0.15,
  16: 0.63,
  17: 0.29,
  18: 0.84,
  19: 0.07,
  20: 0.52
};

export const createFunctionScoreOverlayData = (variants: Variant[]): OverlayData => {
  const functionScores: OverlayData = {};
  
  variants.forEach(item => {
    if (item.nucleotide !== null && item.function_score !== null) {
      const nucleotide = item.nucleotide as number;
      const functionScore = item.function_score as number;
      if (!functionScores[nucleotide] || Math.abs(functionScore) > Math.abs(functionScores[nucleotide]!)) {
        functionScores[nucleotide] = functionScore;
      }
    }
  });
  
  return functionScores;
};

export const createDepletionGroupOverlayData = (variants: Variant[]): OverlayData => {
  const depletionGroups: OverlayData = {};
  
  variants.forEach(item => {
    if (item.nucleotide !== null && item.depletion_group !== null) {
      const nucleotide = item.nucleotide as number;
      const depletionValue = item.depletion_group === 'strong' ? 3 : 
                             item.depletion_group === 'moderate' ? 2 : 
                             item.depletion_group === 'normal' ? 1 : 0;
      
      if (depletionValue > 0 && (!depletionGroups[nucleotide] || depletionValue > depletionGroups[nucleotide]!)) {
        depletionGroups[nucleotide] = depletionValue;
      }
    }
  });
  
  return depletionGroups;
};

// Export for backward compatibility
export const variantData = clinicalVariants;