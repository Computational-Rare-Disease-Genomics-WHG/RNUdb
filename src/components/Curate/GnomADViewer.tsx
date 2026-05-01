import React from 'react';
import { BarChart3, Users, Info } from 'lucide-react';

interface GnomADViewerProps {
  variants: Array<{
    id: string;
    position: number;
    ref: string;
    alt: string;
    gnomad_ac?: number | null;
    gnomad_hom?: number | null;
    aou_ac?: number | null;
    ukbb_ac?: number | null;
    clinical_significance?: string;
  }>;
  geneStart: number;
  geneEnd: number;
}

export const GnomADViewer: React.FC<GnomADViewerProps> = ({
  variants,
  geneStart,
  geneEnd,
}) => {
  if (!variants.length) return null;

  const hasGnomAD = variants.some(v => v.gnomad_ac !== null && v.gnomad_ac !== undefined);
  const hasAoU = variants.some(v => v.aou_ac !== null && v.aou_ac !== undefined);
  const hasUKBB = variants.some(v => v.ukbb_ac !== null && v.ukbb_ac !== undefined);

  if (!hasGnomAD && !hasAoU && !hasUKBB) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">Population Frequencies</h3>
        </div>
        <div className="text-center py-8 text-slate-500">
          <Info className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p>No population frequency data available for this gene.</p>
          <p className="text-sm mt-1">Import variants with gnomAD, AoU, or UKBB allele counts to see frequency visualizations.</p>
        </div>
      </div>
    );
  }

  const geneLength = geneEnd - geneStart;
  const maxAC = Math.max(...variants.map(v => v.gnomad_ac || 0));
  const maxHeight = 120;

  const getColor = (sig?: string) => {
    switch (sig?.toLowerCase()) {
      case 'pathogenic': return '#dc2626';
      case 'likely pathogenic': return '#ea580c';
      case 'vus': return '#ca8a04';
      case 'likely benign': return '#16a34a';
      case 'benign': return '#15803d';
      default: return '#0d9488';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">Population Frequencies</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {hasGnomAD && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-teal-600"></div>
              <span>gnomAD</span>
            </div>
          )}
          {hasAoU && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span>All of Us</span>
            </div>
          )}
          {hasUKBB && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span>UK Biobank</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative h-40 w-full">
        <svg className="w-full h-full" viewBox={`0 0 100 ${maxHeight + 20}`} preserveAspectRatio="none">
          {/* Gene position line */}
          <line
            x1="0"
            y1={maxHeight}
            x2="100"
            y2={maxHeight}
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Position markers */}
          <text x="0" y={maxHeight + 15} fontSize="3" fill="#94a3b8" textAnchor="start">
            {geneStart.toLocaleString()}
          </text>
          <text x="100" y={maxHeight + 15} fontSize="3" fill="#94a3b8" textAnchor="end">
            {geneEnd.toLocaleString()}
          </text>

          {/* Variant bars */}
          {variants
            .filter(v => v.gnomad_ac !== null && v.gnomad_ac !== undefined)
            .map((variant) => {
              const x = ((variant.position - geneStart) / geneLength) * 100;
              const height = maxAC > 0 ? ((variant.gnomad_ac || 0) / maxAC) * (maxHeight - 20) : 0;
              const color = getColor(variant.clinical_significance);

              return (
                <g key={variant.id}>
                  <rect
                    x={Math.max(x - 0.5, 0)}
                    y={maxHeight - height}
                    width="1"
                    height={height}
                    fill={color}
                    opacity="0.8"
                    rx="0.5"
                  >
                    <title>
                      {variant.id}: {variant.ref}→{variant.alt} at {variant.position.toLocaleString()}
                      {'\n'}gnomAD AC: {variant.gnomad_ac}
                      {variant.gnomad_hom ? ` | Hom: ${variant.gnomad_hom}` : ''}
                      {variant.clinical_significance ? `\nClinical: ${variant.clinical_significance}` : ''}
                    </title>
                  </rect>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {hasGnomAD && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
              <Users className="h-4 w-4" />
              <span>gnomAD</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {variants.filter(v => v.gnomad_ac && v.gnomad_ac > 0).length}
            </p>
            <p className="text-xs text-slate-500">variants with frequency data</p>
          </div>
        )}
        {hasAoU && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
              <Users className="h-4 w-4" />
              <span>All of Us</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {variants.filter(v => v.aou_ac && v.aou_ac > 0).length}
            </p>
            <p className="text-xs text-slate-500">variants with frequency data</p>
          </div>
        )}
        {hasUKBB && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
              <Users className="h-4 w-4" />
              <span>UK Biobank</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {variants.filter(v => v.ukbb_ac && v.ukbb_ac > 0).length}
            </p>
            <p className="text-xs text-slate-500">variants with frequency data</p>
          </div>
        )}
      </div>
    </div>
  );
};
