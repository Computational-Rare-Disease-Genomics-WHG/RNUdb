import { describe, it, expect } from "vitest";
import {
  COLORBLIND_FRIENDLY_PALETTE,
  generateGnomadColor,
  generateGnomadColorWithAlpha,
  getClinvarColor,
  getScoreColor,
  getFunctionScoreColor,
} from "./colors";

describe("COLORBLIND_FRIENDLY_PALETTE", () => {
  it("has valid PRIMARY colors", () => {
    expect(COLORBLIND_FRIENDLY_PALETTE.PRIMARY).toBe("#0d9488");
    expect(COLORBLIND_FRIENDLY_PALETTE.PRIMARY_LIGHT).toBe("#14b8a6");
    expect(COLORBLIND_FRIENDLY_PALETTE.PRIMARY_DARK).toBe("#0f766e");
  });

  it("has valid CLINVAR colors", () => {
    expect(COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC).toBe("#DC2626");
    expect(COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_PATHOGENIC).toBe(
      "#EA580C",
    );
    expect(COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS).toBe("#F59E0B");
    expect(COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN).toBe("#059669");
    expect(COLORBLIND_FRIENDLY_PALETTE.CLINVAR.LIKELY_BENIGN).toBe("#047857");
  });

  it("has valid DNA base colors", () => {
    expect(COLORBLIND_FRIENDLY_PALETTE.DNA_BASES.A).toBe("#E11D48");
    expect(COLORBLIND_FRIENDLY_PALETTE.DNA_BASES.T).toBe("#2563EB");
    expect(COLORBLIND_FRIENDLY_PALETTE.DNA_BASES.G).toBe("#059669");
    expect(COLORBLIND_FRIENDLY_PALETTE.DNA_BASES.C).toBe("#F59E0B");
  });

  it("has valid NEUTRAL colors", () => {
    expect(COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND).toBe("#FFFFFF");
    expect(COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.LIGHT_GRAY).toBe("#F8FAFC");
    expect(COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.MEDIUM_GRAY).toBe("#6B7280");
    expect(COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.DARK_GRAY).toBe("#374151");
    expect(COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BORDER).toBe("#E2E8F0");
  });
});

describe("generateGnomadColor", () => {
  it("returns background for frequency 0", () => {
    expect(generateGnomadColor(0)).toBe("#FFFFFF");
  });

  it("returns LOW for frequency <= 0.2", () => {
    expect(generateGnomadColor(0.1)).toBe("#DBEAFE");
    expect(generateGnomadColor(0.2)).toBe("#DBEAFE");
  });

  it("returns MEDIUM_LOW for frequency <= 0.4", () => {
    expect(generateGnomadColor(0.3)).toBe("#93C5FD");
    expect(generateGnomadColor(0.4)).toBe("#93C5FD");
  });

  it("returns MEDIUM for frequency <= 0.6", () => {
    expect(generateGnomadColor(0.5)).toBe("#3B82F6");
    expect(generateGnomadColor(0.6)).toBe("#3B82F6");
  });

  it("returns MEDIUM_HIGH for frequency <= 0.8", () => {
    expect(generateGnomadColor(0.7)).toBe("#1D4ED8");
    expect(generateGnomadColor(0.8)).toBe("#1D4ED8");
  });

  it("returns HIGH for frequency > 0.8", () => {
    expect(generateGnomadColor(0.9)).toBe("#1E3A8A");
    expect(generateGnomadColor(1)).toBe("#1E3A8A");
  });
});

describe("generateGnomadColorWithAlpha", () => {
  it("returns background for frequency 0", () => {
    expect(generateGnomadColorWithAlpha(0)).toBe("#FFFFFF");
  });

  it("returns blue with alpha for non-zero frequencies", () => {
    expect(generateGnomadColorWithAlpha(0.5)).toContain("rgba(37, 99, 235,");
    expect(generateGnomadColorWithAlpha(1)).toContain("rgba(37, 99, 235, 1)");
  });

  it("uses minimum alpha of 0.1 for very small frequencies", () => {
    const result = generateGnomadColorWithAlpha(0.01);
    expect(result).toContain("0.1)");
  });
});

describe("getClinvarColor", () => {
  it("returns PATHOGENIC for path", () => {
    expect(getClinvarColor("path")).toBe("#DC2626");
    expect(getClinvarColor("PATHOGENIC")).toBe("#DC2626");
  });

  it("returns LIKELY_PATHOGENIC for likely pathogenic", () => {
    expect(getClinvarColor("likely pathogenic")).toBe("#EA580C");
    expect(getClinvarColor("LP")).toBe("#EA580C");
  });

  it("returns BENIGN for benign", () => {
    expect(getClinvarColor("benign")).toBe("#059669");
  });

  it("returns LIKELY_BENIGN for likely benign", () => {
    expect(getClinvarColor("likely benign")).toBe("#047857");
  });

  it("returns VUS for uncertain significance", () => {
    expect(getClinvarColor("VUS")).toBe("#F59E0B");
  });

  it("returns VUS for unrecognized strings", () => {
    expect(getClinvarColor("random")).toBe("#F59E0B");
  });
});

describe("getScoreColor", () => {
  it("returns base color for null score", () => {
    expect(getScoreColor(null)).toBe("#0d9488");
  });

  it("returns base color for undefined score", () => {
    expect(getScoreColor(undefined)).toBe("#0d9488");
  });

  it("returns low opacity for zero or negative scores", () => {
    const result = getScoreColor(0);
    expect(result).toContain("rgba(13, 148, 136, 0.3)");
    expect(getScoreColor(-1)).toContain("rgba(13, 148, 136, 0.3)");
  });

  it("returns increasing opacity for positive scores", () => {
    const result1 = getScoreColor(1);
    const result10 = getScoreColor(10);

    // Higher scores should have higher opacity (larger alpha value)
    const alpha1 = parseFloat(result1.match(/[\d.]+\)$/)?.[0] || "0");
    const alpha10 = parseFloat(result10.match(/[\d.]+\)$/)?.[0] || "0");
    expect(alpha10).toBeGreaterThan(alpha1);
  });

  it("accepts custom base color", () => {
    const result = getScoreColor(5, "#FF0000");
    expect(result).toContain("rgba(255, 0, 0,");
  });
});

describe("getFunctionScoreColor", () => {
  it("returns background for score 0", () => {
    expect(getFunctionScoreColor(0)).toBe("#FFFFFF");
  });

  it("returns red shades for negative scores", () => {
    const result = getFunctionScoreColor(-5);
    expect(result).toContain("rgb(");
    expect(result).not.toBe("#FFFFFF");
  });

  it("returns green shades for positive scores", () => {
    const result = getFunctionScoreColor(5);
    expect(result).toContain("rgb(");
    expect(result).not.toBe("#FFFFFF");
  });

  it("handles boundary scores", () => {
    expect(getFunctionScoreColor(-5)).not.toBe("#FFFFFF");
    expect(getFunctionScoreColor(5)).not.toBe("#FFFFFF");
  });
});
