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
  const trackVariants = React.useMemo(() => {
    if (!variants || variants.length === 0) return [];
    
    return variants
      .filter(variant => {
        if (!variant) return false;
        const pos = variant.position;
        if (pos === undefined || pos === null || pos === '') return false;
        const numPos = Number(pos);
        return !isNaN(numPos);
      })
      .map((variant, index) => {
        const sig = variant.clinical_significance || 'VUS';
        return {
          variant_id: `clinvar-${variant.id || index}`,
          pos: Number(variant.position),
          ref: variant.ref || '',
          alt: variant.alt || '',
          allele_freq: (variant.gnomad_ac || 0) / 1000000,
          consequence: variant.consequence || 'unknown',
          clinical_significance: sig,
          isHighlighted: sig === 'Pathogenic' || sig === 'Likely Pathogenic' || sig === 'LP' || sig === 'PATH'
        };
      });
  }, [variants]);

  if (trackVariants.length === 0) return null;

  return (
    <div className="w-full">
      <VariantTrack
        title={`${title} (${trackVariants.length})`}
        height={60}
        variants={trackVariants}
        variantColor={(variant: any) => getClinvarColor(variant.clinical_significance || 'VUS')}
      />
    </div>
  );
};

export default CuratorVariantTrack;
