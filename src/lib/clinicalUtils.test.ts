import { describe, it, expect } from "vitest";
import {
  normalizeClinicalString,
  getClinicalCategory,
  clinicalCategoryToValue,
  clinicalCategoryToDisplay,
} from "./clinicalUtils";

describe("normalizeClinicalString", () => {
  it("returns empty string for null", () => {
    expect(normalizeClinicalString(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(normalizeClinicalString(undefined)).toBe("");
  });

  it("trims and uppercases string", () => {
    expect(normalizeClinicalString("  pathogenic  ")).toBe("PATHOGENIC");
    expect(normalizeClinicalString("VUS")).toBe("VUS");
  });

  it("handles empty string", () => {
    expect(normalizeClinicalString("")).toBe("");
  });
});

describe("getClinicalCategory", () => {
  it("returns OTHER for null/undefined", () => {
    expect(getClinicalCategory(null)).toBe("OTHER");
    expect(getClinicalCategory(undefined)).toBe("OTHER");
  });

  it("returns PATHOGENIC for pathogenic variants", () => {
    expect(getClinicalCategory("pathogenic")).toBe("PATHOGENIC");
    expect(getClinicalCategory("PATHOGENIC")).toBe("PATHOGENIC");
    expect(getClinicalCategory("P")).toBe("PATHOGENIC");
    expect(getClinicalCategory("PATH")).toBe("PATHOGENIC");
  });

  it("returns LIKELY_PATHOGENIC for likely pathogenic", () => {
    expect(getClinicalCategory("likely pathogenic")).toBe("LIKELY_PATHOGENIC");
    expect(getClinicalCategory("LP")).toBe("LIKELY_PATHOGENIC");
    expect(getClinicalCategory("LIKELY_PATHOGENIC")).toBe("LIKELY_PATHOGENIC");
    expect(getClinicalCategory("LIKELYPATHOGENIC")).toBe("LIKELY_PATHOGENIC");
  });

  it("returns BENIGN for benign variants", () => {
    expect(getClinicalCategory("benign")).toBe("BENIGN");
    expect(getClinicalCategory("B")).toBe("BENIGN");
  });

  it("returns LIKELY_BENIGN for likely benign", () => {
    expect(getClinicalCategory("likely benign")).toBe("LIKELY_BENIGN");
    expect(getClinicalCategory("LB")).toBe("LIKELY_BENIGN");
    expect(getClinicalCategory("LIKELY_BENIGN")).toBe("LIKELY_BENIGN");
  });

  it("returns VUS for uncertain significance", () => {
    expect(getClinicalCategory("VUS")).toBe("VUS");
    expect(getClinicalCategory("uncertain significance")).toBe("VUS");
    expect(getClinicalCategory("variant of uncertain significance")).toBe(
      "VUS",
    );
    expect(getClinicalCategory("unknown significance")).toBe("VUS");
  });

  it("returns OTHER for unrecognized strings", () => {
    expect(getClinicalCategory("random value")).toBe("OTHER");
    expect(getClinicalCategory("")).toBe("OTHER");
  });

  it("handles case insensitivity", () => {
    expect(getClinicalCategory("Pathogenic")).toBe("PATHOGENIC");
    expect(getClinicalCategory("BENIGN")).toBe("BENIGN");
  });
});

describe("clinicalCategoryToValue", () => {
  it("returns 1 for PATHOGENIC", () => {
    expect(clinicalCategoryToValue("PATHOGENIC")).toBe(1);
  });

  it("returns 1 for LIKELY_PATHOGENIC", () => {
    expect(clinicalCategoryToValue("LIKELY_PATHOGENIC")).toBe(1);
  });

  it("returns 0.5 for BENIGN", () => {
    expect(clinicalCategoryToValue("BENIGN")).toBe(0.5);
  });

  it("returns 0.5 for LIKELY_BENIGN", () => {
    expect(clinicalCategoryToValue("LIKELY_BENIGN")).toBe(0.5);
  });

  it("returns 0.25 for VUS", () => {
    expect(clinicalCategoryToValue("VUS")).toBe(0.25);
  });

  it("returns 0 for OTHER", () => {
    expect(clinicalCategoryToValue("OTHER")).toBe(0);
  });
});

describe("clinicalCategoryToDisplay", () => {
  it("returns display string for each category", () => {
    expect(clinicalCategoryToDisplay("PATHOGENIC")).toBe("Pathogenic");
    expect(clinicalCategoryToDisplay("LIKELY_PATHOGENIC")).toBe(
      "Likely Pathogenic",
    );
    expect(clinicalCategoryToDisplay("BENIGN")).toBe("Benign");
    expect(clinicalCategoryToDisplay("LIKELY_BENIGN")).toBe("Likely Benign");
    expect(clinicalCategoryToDisplay("VUS")).toBe("VUS");
  });

  it("returns original string for OTHER if provided", () => {
    expect(clinicalCategoryToDisplay("OTHER", "custom value")).toBe(
      "custom value",
    );
  });

  it("returns 'Unknown' for OTHER without original", () => {
    expect(clinicalCategoryToDisplay("OTHER")).toBe("Unknown");
  });
});
