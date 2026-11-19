import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NucleotideComponent from "./NucleotideComponent";

const renderNucleotide = (uncuratedClinvar?: boolean) =>
  render(
    <svg>
      <NucleotideComponent
        nucleotide={{ id: 67, base: "A", x: 10, y: 10 }}
        color="#d32f2f"
        isHovered={false}
        isSelected={false}
        onHover={vi.fn()}
        onClick={vi.fn()}
        clinicalSignificance="Pathogenic/Likely Pathogenic"
        uncuratedClinvar={uncuratedClinvar}
      />
    </svg>,
  );

describe("NucleotideComponent", () => {
  it("marks a ClinVar-only classification with a dashed ring and label", () => {
    const { container } = renderNucleotide(true);
    expect(container.querySelector('[data-testid="clinvar-ring"]')).toHaveAttribute(
      "stroke-dasharray",
    );
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Nucleotide A at position 67, clinical significance: Pathogenic/Likely Pathogenic (ClinVar)",
    );
  });

  it("draws no ClinVar ring for curated classifications", () => {
    const { container } = renderNucleotide(false);
    expect(container.querySelector('[data-testid="clinvar-ring"]')).toBeNull();
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Nucleotide A at position 67, clinical significance: Pathogenic/Likely Pathogenic",
    );
  });
});
