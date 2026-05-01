import React from 'react';
import { BarChart3, Info } from 'lucide-react';

interface Variant {
  id: string;
  position: number;
  ref: string;
  alt: string;
  clinical_significance?: string;
  gnomad_ac?: number | null;
}

interface GnomADVariantViewerProps {
  variants: Variant[];
  geneStart: number;
  geneEnd: number;
  geneName: string;
}

export const GnomADVariantViewer: React.FC<GnomADVariantViewerProps> = ({
  variants,
  geneStart,
  geneEnd,
  geneName,
}) => {
  if (!variants.length) return null;

  const geneLength = geneEnd - geneStart;
  const svgWidth = 100;
  const padding = 8;

  const getScale = (pos: number) => {
    const normalized = (pos - geneStart) / geneLength;
    return padding + normalized * (svgWidth - 2 * padding);
  };

  // Count variants by significance
  const significanceCounts = variants.reduce((acc, variant) => {
    const sig = variant.clinical_significance || 'Unknown';
    acc[sig] = (acc[sig] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getClinicalColor = (sig?: string) => {
    switch (sig?.toLowerCase()) {
      case 'pathogenic': return '#ef4444';
      case 'likely pathogenic': return '#f97316';
      case 'vus': return '#eab308';
      case 'likely benign': return '#22c55e';
      case 'benign': return '#16a34a';
      default: return '#64748b';
    }
  };

  // Group variants into rows to avoid overlap
  const variantRows: Variant[][] = [];
  const rowHeight = 6;

  variants.forEach((variant) => {
    let placed = false;
    for (const row of variantRows) {
      // Check if this overlap with last variant in row
      const lastVariant = row[row.length - 1];
      const lastPos = getScale(lastVariant.position);
      const currPos = getScale(variant.position);
      if (Math.abs(currPos - lastPos) > 3) {
        row.push(variant);
        placed = true;
        break;
      }
    }
    if (!placed) {
      variantRows.push([variant]);
    }
  });

  const totalRows = Math.max(variantRows.length, 1);
  const chartHeight = totalRows * rowHeight + 10;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">Variant Track</h3>
          <span className="text-sm text-slate-500">{geneName}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {Object.entries(significanceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([sig, count]) => (
              <div key={sig} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getClinicalColor(sig) }}
                />
                <span className="text-slate-600">
                  {sig}: <span className="font-semibold">{count}</span>
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Genomic track visualization */}
      <div className="relative w-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight + 15}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Position labels */}
          <text x={padding} y={chartHeight + 12} fontSize="4" fill="#94a3b8" textAnchor="start">
            {geneStart.toLocaleString()}
          </text>
          <text x={svgWidth - padding} y={chartHeight + 12} fontSize="4" fill="#94a3b8" textAnchor="end">
            {geneEnd.toLocaleString()}
          </text>

          {/* Gene region line */}
          <line
            x1={padding}
            y1={chartHeight + 2}
            x2={svgWidth - padding}
            y2={chartHeight + 2}
            stroke="#cbd5e1"
            strokeWidth="0.5"
          />

          {/* Region markers */}
          {[0.25, 0.5, 0.75].map((tick) => (
            <line
              key={tick}
              x1={padding + tick * (svgWidth - 2 * padding)}
              y1={chartHeight + 1}
              x2={padding + tick * (svgWidth - 2 * padding)}
              y2={chartHeight + 3}
              stroke="#94a3b8"
              strokeWidth="0.3"
            />
          ))}

          {/* Variant lollipops */}
          {variantRows.map((row, rowIndex) =>
            row.map((variant) => {
              const x = getScale(variant.position);
              const y = rowIndex * rowHeight + 4;
              const color = getClinicalColor(variant.clinical_significance);

              return (
                <g key={variant.id}>
                  {/* Line */}
                  <line
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={chartHeight + 2}
                    stroke={color}
                    strokeWidth="0.3"
                    opacity="0.6"
                  />
                  {/* Circle/button */}
                  <circle
                    cx={x}
                    cy={y}
                    r="2"
                    fill={color}
                    stroke="white"
                    strokeWidth="0.5"
                    className="cursor-pointer hover:r-3"
                  >
                    <title>
                      {variant.id}: {variant.position.toLocaleString()} ({variant.ref}→{variant.alt})
                      {variant.clinical_significance ? `\nClinical: ${variant.clinical_significance}` : ''}
                      {variant.gnomad_ac ? `\ngnomAD AC: ${variant.gnomad_ac}` : ''}
                    </title>
                  </circle>
                </g>
              );
            })
          )}
        </svg>

        {/* Hover overlay for positions */}
        <div className="absolute bottom-1 left-1 right-1 flex justify-between text-[10px] text-slate-400 px-2">
          <span>Gene start</span>
          <span>{geneLength.toLocaleString()} bp</span>
          <span>Gene end</span>
        </div>
      </div>

      {/* Statistics row */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-1">
          <span className="font-semibold">{variants.length}</span>
          <span>variants across gene</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Info className="h-3.5 w-3.5" />
          <span className="text-xs">Hover over circles for variant details</span>
        </div>
      </div>
    </div>
  );
};
