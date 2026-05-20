import { Track } from "@gnomad/region-viewer";
import React from "react";
import type { StructuralFeature } from "../../types";

const FEATURE_TYPE_COLORS: Record<string, string> = {
  "k-turn": "#8b5cf6",
  hairpin: "#3b82f6",
  loop: "#10b981",
  stem: "#f59e0b",
  bulge: "#ef4444",
  "internal-loop": "#ec4899",
  "multi-branch-loop": "#06b6d4",
  custom: "#6b7280",
};

interface DomainsTrackProps {
  domains: StructuralFeature[];
  regions: { start: number; stop: number }[];
  geneStart: number;
}

const DomainsTrack: React.FC<DomainsTrackProps> = ({ domains, regions, geneStart }) => {
  const height = 50;
  const currentRegion = regions[0];

  const getFeatureColor = (feature: StructuralFeature): string => {
    if (feature.color) return feature.color;
    return FEATURE_TYPE_COLORS[feature.feature_type] || "#6b7280";
  };

  const getGenomicPos = (nucleotideId: number): number => {
    return geneStart + nucleotideId - 1;
  };

  const visibleDomains = domains
    .map((feature) => {
      const ids = feature.nucleotide_ids;
      if (ids.length === 0) return null;
      const startNuc = Math.min(...ids);
      const endNuc = Math.max(...ids);
      const genomicStart = getGenomicPos(startNuc);
      const genomicEnd = getGenomicPos(endNuc);
      return { feature, genomicStart, genomicEnd };
    })
    .filter(
      (d): d is NonNullable<typeof d> =>
        d !== null &&
        d.genomicStart <= currentRegion.stop &&
        d.genomicEnd >= currentRegion.start,
    );

  return (
    <Track title="Domains">
      {({ scalePosition, width }) => (
        <svg height={height} width={width}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="white"
            stroke="#e5e7eb"
          />
          {visibleDomains.map(({ feature, genomicStart, genomicEnd }) => {
            const x1 = scalePosition(genomicStart);
            const x2 = scalePosition(genomicEnd);
            const barWidth = Math.max(x2 - x1, 4);
            const color = getFeatureColor(feature);
            const barY = 8;
            const barHeight = height - 16;
            const labelY = height / 2 + 1;

            const showLabel = x2 - x1 > 20;

            return (
              <g key={feature.id}>
                <rect
                  x={x1}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  fillOpacity={0.3}
                  stroke={color}
                  strokeWidth={1.5}
                  rx={4}
                />
                {showLabel && (
                  <text
                    x={x1 + barWidth / 2}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fill={color}
                    fontWeight={600}
                  >
                    {feature.label_text}
                  </text>
                )}
                <title>
                  {`${feature.feature_type}: ${feature.label_text} (nucleotides ${Math.min(...feature.nucleotide_ids)}-${Math.max(...feature.nucleotide_ids)})`}
                </title>
              </g>
            );
          })}
        </svg>
      )}
    </Track>
  );
};

export default DomainsTrack;
