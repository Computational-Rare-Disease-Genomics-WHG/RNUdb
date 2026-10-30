import { describe, expect, it } from "vitest";
import {
  getSgeEvidence,
  SGE_EVIDENCE_BREAKPOINTS,
  type SgeEvidenceCode,
} from "./sgeEvidence";

describe("getSgeEvidence", () => {
  it("returns null for null / undefined / non-finite scores", () => {
    expect(getSgeEvidence(null)).toBeNull();
    expect(getSgeEvidence(undefined)).toBeNull();
    expect(getSgeEvidence(Number.NaN)).toBeNull();
    expect(getSgeEvidence(Number.POSITIVE_INFINITY)).toBeNull();
    expect(getSgeEvidence(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  it("returns PS3_mod for the paper's worked example (RNU4-2 n.76C>T, score −0.352)", () => {
    expect(getSgeEvidence(-0.352)).toBe("PS3_mod");
    expect(getSgeEvidence(-0.35)).toBe("PS3_mod");
  });

  it("maps strongly depleted scores to PS3 (strong)", () => {
    expect(getSgeEvidence(-0.46)).toBe("PS3");
    expect(getSgeEvidence(-0.9)).toBe("PS3");
    expect(getSgeEvidence(-2.0)).toBe("PS3");
  });

  it("maps moderate depletion scores to PS3_mod", () => {
    expect(getSgeEvidence(-0.365)).toBe("PS3_mod");
    expect(getSgeEvidence(-0.45)).toBe("PS3_mod");
    expect(getSgeEvidence(-0.36)).toBe("PS3_mod");
  });

  it("maps mild depletion scores to PS3_supp", () => {
    expect(getSgeEvidence(-0.347)).toBe("PS3_supp");
    expect(getSgeEvidence(-0.33)).toBe("PS3_supp");
  });

  it("maps intermediate scores to indeterminate", () => {
    expect(getSgeEvidence(-0.32)).toBe("indeterminate");
    expect(getSgeEvidence(-0.3)).toBe("indeterminate");
    expect(getSgeEvidence(-0.28)).toBe("indeterminate");
  });

  it("maps mild enrichment to BS3_supp", () => {
    expect(getSgeEvidence(-0.27)).toBe("BS3_supp");
    expect(getSgeEvidence(-0.25)).toBe("BS3_supp");
  });

  it("maps moderate enrichment to BS3_mod", () => {
    expect(getSgeEvidence(-0.23)).toBe("BS3_mod");
    expect(getSgeEvidence(-0.1)).toBe("BS3_mod");
    expect(getSgeEvidence(0.07)).toBe("BS3_mod");
  });

  it("maps strong enrichment / neutral-high scores to BS3 (strong)", () => {
    expect(getSgeEvidence(0.073)).toBe("BS3");
    expect(getSgeEvidence(0.2)).toBe("BS3");
    expect(getSgeEvidence(0.369493802)).toBe("BS3");
  });

  it("handles boundary values deterministically", () => {
    // PS3 (strong) guardrail: paper states PS3 strong only below −0.45
    expect(getSgeEvidence(-0.4501)).toBe("PS3");
    expect(getSgeEvidence(-0.45)).toBe("PS3_mod");
    // PS3_mod | PS3_supp boundary
    expect(getSgeEvidence(-0.3501)).toBe("PS3_mod");
    expect(getSgeEvidence(-0.35)).toBe("PS3_mod");
    // BS3_mod | BS3 boundary
    expect(getSgeEvidence(0.072)).toBe("BS3_mod");
    expect(getSgeEvidence(0.0721)).toBe("BS3");
  });
});

describe("SGE_EVIDENCE_BREAKPOINTS", () => {
  it("is ordered ascending by max", () => {
    const maxes = SGE_EVIDENCE_BREAKPOINTS.map((bp) => bp.max);
    for (let i = 1; i < maxes.length; i++) {
      expect(maxes[i]).toBeGreaterThan(maxes[i - 1]);
    }
  });

  it("covers every finite score with exactly one code", () => {
    // Every finite score must map to a non-null code.
    const scores = [-10, -5, -2.069, -0.9, -0.465, -0.302, -0.1, 0, 0.244, 1, 10];
    for (const score of scores) {
      const code: SgeEvidenceCode = getSgeEvidence(score);
      expect(code).not.toBeNull();
    }
  });
});
