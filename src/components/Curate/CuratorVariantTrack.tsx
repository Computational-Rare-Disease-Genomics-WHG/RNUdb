import VariantTrack from "@gnomad/track-variants";
import React from "react";
import { getClinvarColor } from "@/lib/colors";

interface CuratorVariantTrackProps {
  variants: any[];
  title?: string;
}

const CuratorVariantTrack: React.FC<CuratorVariantTrackProps> = ({
  variants,
  title = "ClinVar",
}) => {
  const clinvarVariants = variants
    .filter(
      (variant) =>
        variant?.position &&
        typeof variant.position === "number" &&
        variant.clinical_significance,
    )
    .map((variant, index) => ({
      variant_id: `clinvar-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref || "",
      alt: variant.alt || "",
      allele_freq: (variant.gnomad_ac || 0) / 1000000,
      consequence: variant.consequence || "unknown",
      clinical_significance: variant.clinical_significance || "VUS",
      isHighlighted: ["Pathogenic", "Likely Pathogenic", "LP", "PATH"].includes(
        variant.clinical_significance,
      ),
    }));

  const gnomadVariants = variants
    .filter(
      (variant) =>
        variant?.position &&
        typeof variant.position === "number" &&
        (variant.gnomad_ac ?? 0) > 0,
    )
    .map((variant, index) => ({
      variant_id: `gnomad-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref || "",
      alt: variant.alt || "",
      allele_freq: (variant.gnomad_ac || 0) / 1000000,
      consequence: variant.consequence || "unknown",
      isHighlighted: false,
    }));

  const aouVariants = variants
    .filter(
      (variant) =>
        variant?.position &&
        typeof variant.position === "number" &&
        (variant.aou_ac ?? 0) > 0,
    )
    .map((variant, index) => ({
      variant_id: `aou-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref || "",
      alt: variant.alt || "",
      allele_freq: (variant.aou_ac || 0) / 1000000,
      consequence: variant.consequence || "unknown",
      isHighlighted: false,
    }));

  if (
    clinvarVariants.length === 0 &&
    gnomadVariants.length === 0 &&
    aouVariants.length === 0
  ) {
    return null;
  }

  return (
    <>
      {gnomadVariants.length > 0 && (
        <VariantTrack
          title={`gnomAD (${gnomadVariants.length})`}
          height={30}
          variants={gnomadVariants}
          variantColor={() => "#2563EB"}
        />
      )}
      {aouVariants.length > 0 && (
        <VariantTrack
          title={`All of Us (${aouVariants.length})`}
          height={30}
          variants={aouVariants}
          variantColor={() => "#7C3AED"}
        />
      )}
      {clinvarVariants.length > 0 && (
        <VariantTrack
          title={`${title} (${clinvarVariants.length})`}
          height={60}
          variants={clinvarVariants}
          variantColor={(variant) =>
            getClinvarColor(variant.clinical_significance || "VUS")
          }
        />
      )}
    </>
  );
};

export default CuratorVariantTrack;
