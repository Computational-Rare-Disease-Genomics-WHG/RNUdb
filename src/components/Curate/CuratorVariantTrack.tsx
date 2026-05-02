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
  console.log('[CuratorVariantTrack] Received variants:', variants);
  console.log('[CuratorVariantTrack] Variants count:', variants?.length);
  
  const trackVariants = React.useMemo(() => {
    if (!variants || variants.length === 0) {
      console.log('[CuratorVariantTrack] No variants to process');
      return [];
    }
    
    console.log('[CuratorVariantTrack] Processing variants, input length:', variants.length);
    
    const processed = variants
      .filter(variant => {
        if (!variant) {
          console.log('[CuratorVariantTrack] Filtered out: null/undefined variant');
          return false;
        }
        const pos = variant.position;
        if (pos === undefined || pos === null || pos === '') {
          console.log('[CuratorVariantTrack] Filtered out: invalid position', pos, 'for variant', variant.id);
          return false;
        }
        const numPos = Number(pos);
        if (isNaN(numPos)) {
          console.log('[CuratorVariantTrack] Filtered out: position is NaN', pos, 'for variant', variant.id);
          return false;
        }
        return true;
      })
      .map((variant, index) => {
        const sig = variant.clinical_significance || 'VUS';
        const transformed = {
          variant_id: `clinvar-${variant.id || index}`,
          pos: Number(variant.position),
          ref: variant.ref || '',
          alt: variant.alt || '',
          allele_freq: (variant.gnomad_ac || 0) / 1000000,
          consequence: variant.consequence || 'unknown',
          clinical_significance: sig,
          isHighlighted: sig === 'Pathogenic' || sig === 'Likely Pathogenic' || sig === 'LP' || sig === 'PATH'
        };
        console.log('[CuratorVariantTrack] Transformed variant:', transformed);
        return transformed;
      });
    
    console.log('[CuratorVariantTrack] Processed variants count:', processed.length);
    return processed;
  }, [variants]);

  console.log('[CuratorVariantTrack] trackVariants length:', trackVariants.length);
  console.log('[CuratorVariantTrack] First few trackVariants:', trackVariants.slice(0, 3));

  if (trackVariants.length === 0) {
    console.log('[CuratorVariantTrack] Returning null - no track variants');
    return null;
  }

  return (
    <div className="w-full">
      <VariantTrack
        title={`${title} (${trackVariants.length})`}
        height={60}
        variants={trackVariants}
        variantColor={(variant: any) => {
          console.log('[CuratorVariantTrack] variantColor called for:', variant);
          return getClinvarColor(variant.clinical_significance || 'VUS');
        }}
      />
    </div>
  );
};

export default CuratorVariantTrack;