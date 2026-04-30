// src/lib/clinicalUtils.ts

export type ClinicalCategory = 'PATHOGENIC' | 'LIKELY_PATHOGENIC' | 'BENIGN' | 'LIKELY_BENIGN' | 'VUS' | 'OTHER';

export const normalizeClinicalString = (sig?: string | null): string => {
  if (!sig) return '';
  return sig.trim().toUpperCase();
};

export const getClinicalCategory = (sig?: string | null): ClinicalCategory => {
  const normalized = normalizeClinicalString(sig);
  if (!normalized) return 'OTHER';

  // Likely checks first to avoid matching "PATHOGENIC" prematurely
  if (normalized === 'LP' || normalized === 'LIKELY PATHOGENIC' || normalized === 'LIKELY_PATHOGENIC' || normalized === 'LIKELYPATHOGENIC') return 'LIKELY_PATHOGENIC';
  if (normalized === 'PATH' || normalized === 'PATHOGENIC' || normalized === 'P') return 'PATHOGENIC';
  if (normalized === 'LB' || normalized === 'LIKELY BENIGN' || normalized === 'LIKELY_BENIGN' || normalized === 'LIKELYBENIGN') return 'LIKELY_BENIGN';
  if (normalized === 'B' || normalized === 'BENIGN') return 'BENIGN';
  if (normalized === 'VUS' || normalized.includes('UNCERTAIN') || normalized.includes('UNKNOWN')) return 'VUS';

  // Fallback heuristic: check substring matches
  if (normalized.includes('LIKELY') && normalized.includes('PATH')) return 'LIKELY_PATHOGENIC';
  if (normalized.includes('PATH')) return 'PATHOGENIC';
  if (normalized.includes('BENIGN')) return 'BENIGN';
  if (normalized.includes('VUS') || normalized.includes('UNCERTAIN')) return 'VUS';

  return 'OTHER';
};

export const clinicalCategoryToValue = (cat: ClinicalCategory): number => {
  switch (cat) {
    case 'PATHOGENIC':
    case 'LIKELY_PATHOGENIC':
      return 1;
    case 'BENIGN':
    case 'LIKELY_BENIGN':
      return 0.5;
    case 'VUS':
      return 0.25;
    default:
      return 0;
  }
};

export const clinicalCategoryToDisplay = (cat: ClinicalCategory, original?: string | null): string => {
  switch (cat) {
    case 'PATHOGENIC':
      return 'Pathogenic';
    case 'LIKELY_PATHOGENIC':
      return 'Likely Pathogenic';
    case 'BENIGN':
      return 'Benign';
    case 'LIKELY_BENIGN':
      return 'Likely Benign';
    case 'VUS':
      return 'VUS';
    default:
      // Fall back to original string if present, otherwise 'Unknown'
      return original || 'Unknown';
  }
};
