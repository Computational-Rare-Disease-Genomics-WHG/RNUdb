// src/lib/sgeEvidence.ts
// ---------------------------------------------------------------------------
// SGE function-score → ACMG functional evidence mapping.
//
// Calibration source: De Jonghe J, et al. "Saturation editing of RNU4-2
// reveals distinct dominant and recessive disorders." Nature 654:429-436
// (2026). Function scores were converted to evidence strengths using the
// Brnich et al. OddsPath framework, with PS3 capped at strong (+4 points).
//
// Design decision (issue #328): the mapping is intentionally GENERIC —
// function score → evidence code only, with no gene or critical-region
// logic. Any gene that gains SGE/functional data in the future works
// automatically. Where the fitted evidence classes overlap on the benign
// side (BS3_mod vs BS3), a monotonic midpoint partition is used; this is an
// approximation outside the calibrated region.
// ---------------------------------------------------------------------------

export type SgeEvidenceCode =
  | "PS3" // strong pathogenic evidence    (+4 pts)
  | "PS3_mod" // moderate pathogenic evidence (+2 pts)
  | "PS3_supp" // supporting pathogenic evidence (+1 pt)
  | "indeterminate" // no directional evidence (0 pts)
  | "BS3_supp" // supporting benign evidence     (+1 pt)
  | "BS3_mod" // moderate benign evidence    (+2 pts)
  | "BS3" // strong benign evidence     (+4 pts)
  | null; // no functional data

export interface SgeEvidenceBreakpoint {
  /** Evidence code assigned when function score falls in this class. */
  code: Exclude<SgeEvidenceCode, null>;
  /** Upper bound on the function score for this code (inclusive). */
  max: number;
  /** When true, the max bound is exclusive (score must be < max). */
  exclusive?: boolean;
}

/**
 * Breakpoints between evidence classes, ascending.
 *
 * PS3 strong uses the paper's stated guardrail: PS3 strong is only assigned
 * when the function score is strictly below −0.45 (De Jonghe et al. Methods).
 * Remaining boundaries are midpoints between adjacent fitted classes:
 *   PS3_mod|PS3_supp −0.350; PS3_supp|indeterminate −0.325;
 *   indeterminate|BS3_supp −0.277; BS3_supp|BS3_mod −0.241;
 *   BS3_mod|BS3 +0.072 (monotonic approximation — see header note).
 */
export const SGE_EVIDENCE_BREAKPOINTS: readonly SgeEvidenceBreakpoint[] = [
  { code: "PS3", max: -0.45, exclusive: true },
  { code: "PS3_mod", max: -0.35 },
  { code: "PS3_supp", max: -0.325 },
  { code: "indeterminate", max: -0.277 },
  { code: "BS3_supp", max: -0.241 },
  { code: "BS3_mod", max: 0.072 },
  { code: "BS3", max: Infinity },
];

/**
 * Map an SGE function score to an ACMG functional evidence code.
 *
 * Returns null when no score is available (or the value is not a finite
 * number), so callers can conditionally render the badge.
 *
 * @example
 * getSgeEvidence(-0.352) // "PS3_mod"  (paper worked example: n.76C>T)
 * getSgeEvidence(-0.9)   // "PS3"
 * getSgeEvidence(0.2)    // "BS3"
 * getSgeEvidence(undefined) // null
 */
export function getSgeEvidence(
  functionScore: number | null | undefined,
): SgeEvidenceCode {
  if (
    functionScore === null ||
    functionScore === undefined ||
    (typeof functionScore === "number" && !Number.isFinite(functionScore))
  ) {
    return null;
  }

  for (const { code, max, exclusive } of SGE_EVIDENCE_BREAKPOINTS) {
    const within = exclusive ? functionScore < max : functionScore <= max;
    if (within) return code;
  }

  // Unreachable: the final breakpoint has an infinite upper bound.
  return "BS3";
}
