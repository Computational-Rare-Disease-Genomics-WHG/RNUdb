// Render tests for the InfoPanel equivalent-variants block (PM5 / Rec 8).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import InfoPanel from "./InfoPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SnRNAGene, Variant, VariantEquivalence } from "@/types";

// jsdom lacks ResizeObserver, which Radix Popper (Tooltip) uses.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ((globalThis as { ResizeObserver?: unknown })
  .ResizeObserver ?? MockResizeObserver) as unknown as typeof ResizeObserver;

const GENE: SnRNAGene = {
  id: "RNU4-2",
  name: "RNU4-2",
  fullName: "RNA, U4 small nuclear 2",
  chromosome: "chr12",
  start: 120291759,
  end: 120291903,
  strand: "-",
  sequence: "ACGUACGUACGUACGUACGUACGUACGUACGUACGU",
  description: "U4 small nuclear RNA",
};

const RNU42_VARIANT = {
  id: "chr12-120291872-C-T",
  geneId: "RNU4-2",
  position: 120291872,
  nucleotidePosition: 32,
  ref: "C",
  alt: "T",
  hgvs: "n.32G>A",
  clinical_significance: "Likely Pathogenic",
};

const RN_U4ATAC_VARIANT = {
  id: "chr2-121530916-G-A",
  geneId: "RNU4atac",
  position: 121530916,
  nucleotidePosition: 37,
  ref: "G",
  alt: "A",
  hgvs: "n.37G>A",
  clinical_significance: "VUS",
};

function makeEquivalence(
  overrides: Partial<VariantEquivalence> = {},
): VariantEquivalence {
  return {
    variant_id: "chr12-120291872-C-T",
    equivalent_variant_id: "chr2-121530916-G-A",
    relationship_type: "analog",
    status: "needs_review",
    variant: RNU42_VARIANT,
    equivalent_variant: RN_U4ATAC_VARIANT,
    ...overrides,
  } as VariantEquivalence;
}

function renderInfoPanel(equivalences: VariantEquivalence[]) {
  return render(
    <MemoryRouter>
      <TooltipProvider delayDuration={0}>
        <InfoPanel
          currentData={GENE}
          paperData={[]}
          literatureCounts={[]}
          variantData={[RNU42_VARIANT as Variant]}
          equivalences={equivalences}
          overlayMode="none"
          onCycleOverlay={() => {}}
          hoveredNucleotide={{ id: 32, base: "G", x: 0, y: 0 }}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("InfoPanel equivalent-variants block", () => {
  it("does not render the PM5 block when no equivalences exist", () => {
    renderInfoPanel([]);
    expect(
      screen.queryByText(/PM5 — Equivalent Variants \(Rec 8\)/),
    ).not.toBeInTheDocument();
  });

  it("labels the block as PM5 / Rec 8 and shows the equivalent variant", () => {
    renderInfoPanel([makeEquivalence()]);
    expect(screen.getByText(/PM5 — Equivalent Variants \(Rec 8\)/)).toBeInTheDocument();
    // Link to the other gene with its HGVS.
    expect(screen.getByText(/RNU4atac n\.37G>A/)).toBeInTheDocument();
  });

  it("renders a PM5 badge when the equivalent (other-gene) variant is P/LP", () => {
    const lpOther = makeEquivalence();
    lpOther.equivalent_variant = {
      ...RN_U4ATAC_VARIANT,
      clinical_significance: "Likely Pathogenic",
    };
    renderInfoPanel([lpOther]);
    expect(screen.getByText("PM5")).toBeInTheDocument();
  });

  it("shows the pair status (needs_review) on the equivalent row", () => {
    renderInfoPanel([makeEquivalence()]);
    expect(screen.getByText(/status: needs_review/)).toBeInTheDocument();
  });

  it("does not show a PM5 badge when the equivalent is not P/LP", () => {
    renderInfoPanel([makeEquivalence()]);
    expect(screen.queryByText("PM5")).not.toBeInTheDocument();
  });

  it("renders a help tooltip explaining Recommendation 8", async () => {
    const user = userEvent.setup();
    renderInfoPanel([makeEquivalence()]);
    const trigger = screen.getByLabelText("About PM5 equivalent variants");
    expect(trigger).toBeInTheDocument();

    await user.hover(trigger);
    const headings = await screen.findAllByText(
      /Recommendation 8 \(PM5 — equivalent variants\)/,
    );
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/same underlying mechanism/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/avoid circularity/).length).toBeGreaterThan(0);
  });
});
