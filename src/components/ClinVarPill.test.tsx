import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ClinVarPill, formatClinvarRelease } from "./ClinVarPill";

describe("ClinVarPill", () => {
  it("labels the classification as ClinVar with review status and release", () => {
    render(
      <ClinVarPill
        reviewStatus="criteria provided, single submitter"
        release="clinvar_20261108"
      />,
    );
    expect(screen.getByText("ClinVar")).toHaveAttribute(
      "title",
      "criteria provided, single submitter · 2026-11-08",
    );
  });

  it("omits missing parts from the title", () => {
    render(<ClinVarPill release="clinvar_20261108" />);
    expect(screen.getByText("ClinVar")).toHaveAttribute("title", "2026-11-08");
  });
});

describe("formatClinvarRelease", () => {
  it("turns a ClinVar release name into a date", () => {
    expect(formatClinvarRelease("clinvar_20261108")).toBe("2026-11-08");
  });

  it("returns anything else unchanged", () => {
    expect(formatClinvarRelease("weekly")).toBe("weekly");
  });
});
