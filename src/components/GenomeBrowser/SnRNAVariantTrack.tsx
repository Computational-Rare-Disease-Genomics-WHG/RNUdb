// SnRNAVariantTrack.tsx
import React from 'react';
import VariantTrack from '@gnomad/track-variants';
import { COLORBLIND_FRIENDLY_PALETTE, getClinvarColor } from '../../lib/colors';

interface SnRNAVariantTrackProps {
  variants: any[];
  gnomadVariants: any[];
  aouVariants: any[];
}

const SnRNAVariantTrack: React.FC<SnRNAVariantTrackProps> = ({ variants, gnomadVariants, aouVariants }) => {
  // Transform clinical variants to the format expected by gnomAD VariantTrack
  const clinvarVariants = variants
    .filter(variant => 
      variant.position && 
      variant.clinical_significance &&
      typeof variant.position === 'number'
    )
    .map((variant, index) => ({
      variant_id: `clinvar-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref,
      alt: variant.alt,
      allele_freq: (variant.gnomad_ac || 0) / 1000000, // Convert AC to frequency estimate
      consequence: variant.consequence || 'unknown',
      clinical_significance: variant.clinical_significance,
      isHighlighted: variant.clinical_significance === 'Pathogenic' || 
                    variant.clinical_significance === 'Likely Pathogenic'
    }));

  // Transform gnomAD variants to the expected format
  const transformedGnomadVariants = gnomadVariants
    .filter(variant => variant.position && typeof variant.position === 'number')
    .map((variant, index) => ({
      variant_id: `gnomad-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref,
      alt: variant.alt,
      allele_freq: (variant.gnomad_ac || 0) / 1000000, // Convert AC to frequency estimate
      consequence: variant.consequence || 'unknown',
      isHighlighted: false
    }));

  // Transform All of Us variants to the expected format
  const transformedAouVariants = aouVariants
    .filter(variant => variant.position && typeof variant.position === 'number')
    .map((variant, index) => ({
      variant_id: `aou-${variant.id}-${index}`,
      pos: variant.position,
      ref: variant.ref,
      alt: variant.alt,
      allele_freq: (variant.aou_ac || 0) / 1000000, // Convert AC to frequency estimate
      consequence: variant.consequence || 'unknown',
      isHighlighted: false
    }));

  return (
    <>
      <VariantTrack
        title={`gnomAD Variants (${transformedGnomadVariants.length} variants)`}
        height={40}
        variants={transformedGnomadVariants}
        variantColor={() => COLORBLIND_FRIENDLY_PALETTE.VARIANTS.GNOMAD}
      />
      <VariantTrack
        title={`All of Us Variants (${transformedAouVariants.length} variants)`}
        height={40}
        variants={transformedAouVariants}
        variantColor={() => '#8B5CF6'} // Purple color for All of Us
      />
      <VariantTrack
        title={`ClinVar Variants (${clinvarVariants.length} variants)`}
        height={40}
        variants={clinvarVariants}
        variantColor={(variant) => getClinvarColor(variant.clinical_significance || 'unknown')}
      />
    </>
  );
};

export default SnRNAVariantTrack;