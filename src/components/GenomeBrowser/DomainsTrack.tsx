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

const FEATURE_TYPE_LABELS: Record<string, string> = {
  "k-turn": "K-turn",
  hairpin: "Hairpin",
  loop: "Loop",
  stem: "Stem",
  bulge: "Bulge",
  "internal-loop": "Internal Loop",
  "multi-branch-loop": "Multi-branch Loop",
  custom: "Custom",
};

interface DomainsTrackProps {
  domains: StructuralFeature[];
  regions: { start: number; stop: number }[];
  geneStart: number;
}

const DomainsTrack: React.FC<DomainsTrackProps> = ({ domains, regions, geneStart }) => {
  const height = 60;
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
            const barY = 12;
            const barHeight = 24;
            const labelY = barY + barHeight / 2;

            const showLabel = x2 - x1 > 30;

            return (
              <g key={feature.id}>
                <rect
                  x={x1}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  fillOpacity={0.15}
                  stroke={color}
                  strokeWidth={2}
                  rx={6}
                  ry={6}
                />
                {showLabel && (
                  <>
                    <rect
                      x={x1 + 4}
                      y={barY + 2}
                      width={Math.max(barWidth - 8, 0)}
                      height={barHeight - 4}
                      fill={color}
                      fillOpacity={0.08}
                      rx={4}
                      ry={4}
                    />
                    <text
                      x={x1 + barWidth / 2}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fill={color}
                      fontWeight={600}
                      letterSpacing="0.02em"
                    >
                      {feature.label_text}
                    </text>
                  </>
                )}
                {!showLabel && (
                  <line
                    x1={x1 + barWidth / 2}
                    y1={barY + 2}
                    x2={x1 + barWidth / 2}
                    y2={barY + barHeight - 2}
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                )}
                <title>
                  {`${FEATURE_TYPE_LABELS[feature.feature_type] || feature.feature_type}: ${feature.label_text}`}
                  {`\nNucleotides: ${Math.min(...feature.nucleotide_ids)}-${Math.max(...feature.nucleotide_ids)}`}
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
