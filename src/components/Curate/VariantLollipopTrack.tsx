import React from 'react';

interface VariantLollipopTrackProps {
  variants: Array<{
    id: string;
    position: number;
    ref?: string;
    alt?: string;
    clinical_significance?: string;
  }>;
  geneStart: number;
  geneEnd: number;
  geneName: string;
}

const getClinicalColor = (sig?: string): string => {
  switch (sig?.toLowerCase()) {
    case 'pathogenic': return '#dc2626';
    case 'likely pathogenic': return '#ea580c';
    case 'vus': return '#ca8a04';
    case 'likely benign': return '#16a34a';
    case 'benign': return '#15803d';
    default: return '#64748b';
  }
};

export const VariantLollipopTrack: React.FC<VariantLollipopTrackProps> = ({
  variants,
  geneStart,
  geneEnd,
  geneName,
}) => {
  if (!variants?.length) return null;

  const geneLength = geneEnd - geneStart;
  const padding = 40;
  const svgWidth = 900;
  const svgHeight = 120;
  const trackY = 60;
  
  const scale = (pos: number) => {
    const normalized = (pos - geneStart) / geneLength;
    return padding + normalized * (svgWidth - 2 * padding);
  };

  // Group variants by position to avoid overlap
  const positionMap = new Map<number, Array<typeof variants[0]>>();
  variants.forEach(v => {
    if (!positionMap.has(v.position)) {
      positionMap.set(v.position, []);
    }
    positionMap.get(v.position)!.push(v);
  });

  // Calculate significance stats
  const sigCounts = variants.reduce((acc, v) => {
    const sig = v.clinical_significance || 'Unknown';
    acc[sig] = (acc[sig] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">{geneName} Variants</h3>
          <span className="text-sm text-slate-500">({variants.length} total)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
          {Object.entries(sigCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([sig, count]) => (
              <div key={sig} className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getClinicalColor(sig) }}
                />
                <span className="text-slate-600 text-xs sm:text-sm">
                  {sig}: <span className="font-semibold">{count}</span>
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[600px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gene region bar */}
          <rect
            x={padding}
            y={trackY - 2}
            width={svgWidth - 2 * padding}
            height={4}
            fill="#e2e8f0"
            rx={2}
          />

          {/* Gene start/end labels */}
          <text x={padding} y={trackY + 25} fontSize="11" fill="#94a3b8" textAnchor="start">
            {geneStart.toLocaleString()}
          </text>
          <text x={svgWidth - padding} y={trackY + 25} fontSize="11" fill="#94a3b8" textAnchor="end">
            {geneEnd.toLocaleString()}
          </text>
          <text x={svgWidth / 2} y={trackY + 25} fontSize="10" fill="#cbd5e1" textAnchor="middle">
            {geneLength.toLocaleString()} bp
          </text>

          {/* Variant lollipops */}
          {Array.from(positionMap.entries()).map(([position, variantsAtPos]) => {
            const x = scale(position);
            const hasPathogenic = variantsAtPos.some(v => 
              v.clinical_significance?.toLowerCase().includes('pathogenic')
            );
            const hasVUS = variantsAtPos.some(v =>
              v.clinical_significance?.toLowerCase().includes('vus')
            );
            
            // Stack multiple variants at same position
            return variantsAtPos.map((variant, idx) => {
              const yOffset = idx * 8;
              const color = getClinicalColor(variant.clinical_significance);
              const radius = hasPathogenic ? 5 : hasVUS ? 4 : 3;
              
              return (
                <g key={`${variant.id}-${idx}`}>
                  {/* Line */}
                  <line
                    x1={x}
                    y1={trackY}
                    x2={x}
                    y2={trackY - 20 - yOffset}
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  {/* Circle */}
                  <circle
                    cx={x}
                    cy={trackY - 20 - yOffset}
                    r={radius}
                    fill={color}
                    stroke="white"
                    strokeWidth="1.5"
                    className="hover:r-6 transition-all"
                  >
                    <title>
                      {variant.id}: {variant.position.toLocaleString()}
                      {variant.ref && variant.alt ? ` (${variant.ref}→${variant.alt})` : ''}
                      {variant.clinical_significance ? `\n${variant.clinical_significance}` : ''}
                    </title>
                  </circle>
                </g>
              );
            });
          })}
        </svg>
      </div>

      <div className="mt-3 text-xs text-slate-400 text-center">
        Hover over circles for variant details
      </div>
    </div>
  );
};

export default VariantLollipopTrack;
