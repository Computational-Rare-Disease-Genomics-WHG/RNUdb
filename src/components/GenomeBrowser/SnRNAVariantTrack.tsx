// SnRNAVariantTrack.tsx
import VariantTrack from "@gnomad/track-variants";
import React from "react";
import { COLORBLIND_FRIENDLY_PALETTE, getClinvarColor } from "../../lib/colors";

interface SnRNAVariantTrackProps {
  variants: any[];
  gnomadVariants: any[];
  aouVariants: any[];
  sourceFilter?: string;
  zygosityFilter?: string;
  selectedVariantPosition?: number | null;
}

const passesZygosity = (
  variant: any,
  zygosityFilter: string,
  acField: string,
  homField: string,
): boolean => {
  if (zygosityFilter === "all") return true;
  const ac = variant[acField] ?? 0;
  const hom = variant[homField] ?? 0;
  if (zygosityFilter === "het") return ac > 2 * hom;
  return hom > 0;
};

const SnRNAVariantTrack: React.FC<SnRNAVariantTrackProps> = ({
  variants,
  gnomadVariants,
  aouVariants,
  sourceFilter = "all",
  zygosityFilter = "all",
  selectedVariantPosition,
}) => {
  const isSelectedPos = (pos: number) =>
    selectedVariantPosition != null && pos === selectedVariantPosition;
  // Transform clinical variants to the format expected by gnomAD VariantTrack
  const clinvarVariants = variants
    .filter(
      (variant) =>
        variant.position &&
        variant.clinical_significance &&
        typeof variant.position === "number",
    )
    .map((variant, index) => ({
      variant_id: `clinvar-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref,
      alt: variant.alt,
      allele_freq: (variant.gnomad_ac || 0) / 1000000,
      consequence: variant.consequence || "unknown",
      clinical_significance: variant.clinical_significance,
      isHighlighted:
        isSelectedPos(variant.position) ||
        variant.clinical_significance === "Pathogenic" ||
        variant.clinical_significance === "Likely Pathogenic" ||
        variant.clinical_significance === "PATH" ||
        variant.clinical_significance === "LP",
    }));

  // Filter and transform gnomAD variants
  const filteredGnomad = gnomadVariants.filter((variant) =>
    passesZygosity(variant, zygosityFilter, "gnomad_ac", "gnomad_hom"),
  );
  const transformedGnomadVariants = filteredGnomad
    .filter((variant) => variant.position && typeof variant.position === "number")
    .map((variant, index) => ({
      variant_id: `gnomad-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref,
      alt: variant.alt,
      allele_freq: (variant.gnomad_ac || 0) / 1000000,
      consequence: variant.consequence || "unknown",
      isHighlighted: isSelectedPos(variant.position),
    }));

  // Filter and transform All of Us variants
  const filteredAou = aouVariants.filter((variant) =>
    passesZygosity(variant, zygosityFilter, "aou_ac", "aou_hom"),
  );
  const transformedAouVariants = filteredAou
    .filter((variant) => variant.position && typeof variant.position === "number")
    .map((variant, index) => ({
      variant_id: `aou-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref,
      alt: variant.alt,
      allele_freq: (variant.aou_ac || 0) / 1000000,
      consequence: variant.consequence || "unknown",
      isHighlighted: isSelectedPos(variant.position),
    }));

  const showGnomad = sourceFilter === "all" || sourceFilter === "gnomad";
  const showAou = sourceFilter === "all" || sourceFilter === "aou";

  return (
    <>
      {showGnomad && (
        <VariantTrack
          title={`gnomAD Variants (${transformedGnomadVariants.length} variants)`}
          height={40}
          variants={transformedGnomadVariants}
          variantColor={() => COLORBLIND_FRIENDLY_PALETTE.VARIANTS.GNOMAD}
        />
      )}
      {showAou && (
        <VariantTrack
          title={`All of Us Variants (${transformedAouVariants.length} variants)`}
          height={40}
          variants={transformedAouVariants}
          variantColor={() => "#8B5CF6"}
        />
      )}
      <VariantTrack
        title={`ClinVar Variants (${clinvarVariants.length} variants)`}
        height={40}
        variants={clinvarVariants}
        variantColor={(variant) =>
          getClinvarColor(variant.clinical_significance || "unknown")
        }
      />
    </>
  );
};

export default SnRNAVariantTrack;
