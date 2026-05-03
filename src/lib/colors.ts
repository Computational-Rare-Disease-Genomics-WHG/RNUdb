// Colorblind-friendly color palette based on Paul Tol's scientific color schemes
// https://personal.sron.nl/~pault/

export const COLORBLIND_FRIENDLY_PALETTE = {
  // Primary theme colors (keep teal as app theme)
  PRIMARY: "#0d9488", // teal-600
  PRIMARY_LIGHT: "#14b8a6", // teal-500
  PRIMARY_DARK: "#0f766e", // teal-700

  // ClinVar colors (high contrast, colorblind-friendly)
  CLINVAR: {
    PATHOGENIC: "#DC2626", // Dark red - most severe
    LIKELY_PATHOGENIC: "#EA580C", // Orange-red - moderately severe
    VUS: "#F59E0B", // Amber - uncertain significance
    BENIGN: "#059669", // Emerald green - safe
    LIKELY_BENIGN: "#047857", // Darker green
  },

  // gnomAD frequency colors (blue gradient - colorblind safe)
  GNOMAD: {
    LOW: "#DBEAFE", // Very light blue
    MEDIUM_LOW: "#93C5FD", // Light blue
    MEDIUM: "#3B82F6", // Blue
    MEDIUM_HIGH: "#1D4ED8", // Dark blue
    HIGH: "#1E3A8A", // Very dark blue
  },

  // All of Us frequency colors (purple gradient - colorblind safe, distinct from gnomAD)
  ALLOFUS: {
    LOW: "#EDE9FE", // Very light purple
    MEDIUM_LOW: "#C4B5FD", // Light purple
    MEDIUM: "#8B5CF6", // Purple
    MEDIUM_HIGH: "#6D28D9", // Dark purple
    HIGH: "#4C1D95", // Very dark purple
  },

  // DNA bases (colorblind-friendly with good contrast)
  DNA_BASES: {
    A: "#E11D48", // Rose - red family but distinguishable
    T: "#2563EB", // Blue
    G: "#059669", // Emerald green
    C: "#F59E0B", // Amber
  },

  // Gene types
  GENES: {
    SNRNA: "#0D9488", // Teal (matches app theme)
    PROTEIN_CODING: "#2563EB", // Blue
    OTHER: "#6B7280", // Gray
  },

  // Variant tracks
  VARIANTS: {
    GNOMAD: "#2563EB", // Blue
    CLINVAR_PATHOGENIC: "#DC2626", // Red
    CLINVAR_BENIGN: "#059669", // Green
    CLINVAR_VUS: "#F59E0B", // Amber
  },

  // Function Score colors (diverging scale - colorblind safe)
  FUNCTION_SCORE: {
    POSITIVE: "#059669", // Green for positive scores (beneficial)
    NEGATIVE: "#DC2626", // Red for negative scores (deleterious)
  },

  // Depletion Group colors (severity scale - colorblind safe)
  DEPLETION: {
    STRONG: "#DC2626", // Red (strong depletion)
    MODERATE: "#F59E0B", // Amber (moderate depletion)
    NORMAL: "#059669", // Green (normal/no depletion)
  },

  // Neutral colors
  NEUTRAL: {
    BACKGROUND: "#FFFFFF",
    LIGHT_GRAY: "#F8FAFC",
    MEDIUM_GRAY: "#6B7280",
    DARK_GRAY: "#374151",
    BORDER: "#E2E8F0",
  },
};

// Helper functions for generating color variations
export const generateGnomadColor = (frequency: number): string => {
  if (frequency === 0) return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
  if (frequency <= 0.2) return COLORBLIND_FRIENDLY_PALETTE.GNOMAD.LOW;
  if (frequency <= 0.4) return COLORBLIND_FRIENDLY_PALETTE.GNOMAD.MEDIUM_LOW;
  if (frequency <= 0.6) return COLORBLIND_FRIENDLY_PALETTE.GNOMAD.MEDIUM;
  if (frequency <= 0.8) return COLORBLIND_FRIENDLY_PALETTE.GNOMAD.MEDIUM_HIGH;
  return COLORBLIND_FRIENDLY_PALETTE.GNOMAD.HIGH;
};

export const generateGnomadColorWithAlpha = (frequency: number): string => {
  if (frequency === 0) return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;

  // Use blue with varying opacity for continuous scale
  const alpha = Math.max(0.1, Math.min(1, frequency));
  return `rgba(37, 99, 235, ${alpha})`; // Blue with alpha
};

export const getClinvarColor = (significance: string): string => {
  const sig = significance.toLowerCase();
  if (sig === "lp" || (sig.includes("pathogenic") && sig.includes("likely"))) {
    return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_PATHOGENIC;
  }
  if (sig === "path" || sig.includes("pathogenic")) {
    return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC;
  }
  if (sig.includes("benign") && sig.includes("likely")) {
    return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_BENIGN;
  }
  if (sig.includes("benign")) {
    return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN;
  }
  return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS;
};

export const getScoreColor = (
  score: number | null | undefined,
  baseColor?: string,
): string => {
  if (score === null || score === undefined) {
    return baseColor || COLORBLIND_FRIENDLY_PALETTE.PRIMARY;
  }

  const base = baseColor || "#0d9488";
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);

  // If score is 0 or negative, use minimum opacity
  if (score <= 0) {
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  }

  // For positive scores, normalize to 0.3-1.0 range using log scale for better visualization
  const minOpacity = 0.3;
  const maxOpacity = 1.0;

  // Use log scale to handle potentially large score values
  const logScore = Math.log10(score + 1);
  const logMax = Math.log10(1000 + 1); // Normalize to a reference max of 1000
  const intensity = Math.min(logScore / logMax, 1.0);

  const opacity = minOpacity + intensity * (maxOpacity - minOpacity);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getFunctionScoreColor = (score: number): string => {
  if (score === 0) return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;

  // Create a continuous color scale from red (negative) to green (positive)
  // Normalize score to 0-1 range (assuming scores typically range from -5 to +5)
  const normalizedScore = (score + 5) / 10; // Maps -5 to 0, +5 to 1
  const clampedScore = Math.max(0, Math.min(1, normalizedScore));

  if (clampedScore < 0.5) {
    // Red to yellow gradient for negative scores
    const intensity = (0.5 - clampedScore) * 2; // 0 to 1
    const red = 220; // Strong red
    const green = Math.round(38 + (255 - 38) * (1 - intensity)); // 38 (dark red) to 255 (yellow)
    const blue = Math.round(38 * (1 - intensity)); // 38 to 0
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // Yellow to green gradient for positive scores
    const intensity = (clampedScore - 0.5) * 2; // 0 to 1
    const red = Math.round(255 - (255 - 5) * intensity); // 255 (yellow) to 5 (green)
    const green = Math.round(150 + 105 * intensity); // 150 to 255
    const blue = Math.round(9 * intensity); // 0 to 9
    return `rgb(${red}, ${green}, ${blue})`;
  }
};
