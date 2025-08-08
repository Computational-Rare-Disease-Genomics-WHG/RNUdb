// SnRNAVariantTrack.tsx
import React from 'react';
import VariantTrack from '@gnomad/track-variants';
import { COLORBLIND_FRIENDLY_PALETTE, getClinvarColor } from '../../lib/colors';

interface SnRNAVariantTrackProps {
  variants: any[];
  gnomadVariants: any[];
}

const SnRNAVariantTrack: React.FC<SnRNAVariantTrackProps> = ({ variants, gnomadVariants }) => {
  // Filter to only clinical variants that have a position field (exclude SGE variants)
  const clinvarVariants = variants
    .filter(variant => variant.position && typeof variant.position === 'string')
    .map((variant, index) => {
      const position = parseInt(variant.position.split(':')[1]);
      return {
        variant_id: `${variant.id}-${index}`, // Make variant_id unique
        pos: position,
        allele_freq: parseFloat(variant.gnomad_frequency || '0'),
        consequence: variant.consequence,
        clinical_significance: variant.clinvar_significance,
        isHighlighted: variant.clinical === 'Pathogenic' || variant.clinical === 'Likely Pathogenic'
      };
    });

  // Ensure gnomAD variants also have unique IDs
  const uniqueGnomadVariants = gnomadVariants.map((variant, index) => ({
    ...variant,
    variant_id: `${variant.variant_id}-gnomad-${index}`
  }));

  return (
    <>
      <VariantTrack
        title="gnomAD Variants (40 variants)"
        height={40}
        variants={uniqueGnomadVariants}
        variantColor={(variant) => {
          return COLORBLIND_FRIENDLY_PALETTE.VARIANTS.GNOMAD;
        }}
      />
      <VariantTrack
        title="ClinVar Variants (5 variants)"
        height={40}
        variants={clinvarVariants}
        variantColor={(variant) => {
          return getClinvarColor(variant.clinical_significance || 'unknown');
        }}
      />
    </>
  );
};

export default SnRNAVariantTrack;