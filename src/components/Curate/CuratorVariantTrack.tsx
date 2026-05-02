import React from 'react';
import VariantTrack from '@gnomad/track-variants';
import { getClinvarColor } from '@/lib/colors';

interface CuratorVariantTrackProps {
  variants: any[];
  title?: string;
}

export const CuratorVariantTrack: React.FC<CuratorVariantTrackProps> = ({ 
  variants,
  title = 'Clinical Variants'
}) => {
  // Transform variants to the format expected by gnomAD VariantTrack
  const trackVariants = variants
    .filter(variant => 
      variant.position && 
      typeof variant.position === 'number'
    )
    .map((variant) => ({
      variant_id: variant.id,
      pos: variant.position,
      ref: variant.ref || '',
      alt: variant.alt || '',
      consequence: variant.consequence || 'unknown',
      clinical_significance: variant.clinical_significance,
      isHighlighted: variant.clinical_significance === 'Pathogenic' || 
                    variant.clinical_significance === 'Likely Pathogenic'
    }));

  return (
    <VariantTrack
      title={`${title} (${trackVariants.length} variants)`}
      height={40}
      variants={trackVariants}
      variantColor={(variant: any) => getClinvarColor(variant.clinical_significance || 'unknown')}
    />
  );
};

export default CuratorVariantTrack;
