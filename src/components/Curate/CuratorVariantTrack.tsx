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
  if (!variants?.length) return null;

  const trackVariants = variants
    .filter(variant => 
      variant.position && 
      typeof variant.position === 'number'
    )
    .map((variant, index) => {
      const sig = variant.clinical_significance || 'unknown';
      return {
        variant_id: `curator-${variant.id}-${index}`,
        pos: variant.position,
        ref: variant.ref || '',
        alt: variant.alt || '',
        allele_freq: (variant.gnomad_ac || 0) / 1000000,
        consequence: variant.consequence || 'unknown',
        clinical_significance: sig,
        isHighlighted: sig === 'Pathogenic' || sig === 'Likely Pathogenic' || sig === 'PATH' || sig === 'LP'
      };
    });

  if (!trackVariants.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
      <VariantTrack
        title={`${title} (${trackVariants.length} variants)`}
        height={60}
        variants={trackVariants}
        variantColor={(variant: any) => getClinvarColor(variant.clinical_significance || 'unknown')}
      />
    </div>
  );
};

export default CuratorVariantTrack;
