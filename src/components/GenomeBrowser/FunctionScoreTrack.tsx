import { Track } from "@gnomad/region-viewer";
import React from "react";
import { COLORBLIND_FRIENDLY_PALETTE } from "../../lib/colors";

interface FunctionScoreTrackProps {
  variants: {
    id: string;
    function_score?: number | null;
    nucleotidePosition?: number | null;
    position?: number;
    ref?: string;
    alt?: string;
    hgvs?: string;
  }[];
  regions: { start: number; stop: number }[];
  geneStart: number;
  geneStrand?: string;
  geneEnd?: number;
}

const FunctionScoreTrack: React.FC<FunctionScoreTrackProps> = ({
  variants,
  regions,
  geneStart,
  geneStrand,
  geneEnd,
}) => {
  const height = 80;
  const padding = 15;
  const currentRegion = regions[0];
  const jitterRange = 6;

  const getNucleotidePos = (v: {
    nucleotidePosition?: number | null;
    position?: number;
  }): number | null => {
    if (v.nucleotidePosition != null) return v.nucleotidePosition;
    if (v.position != null && geneStrand && geneEnd) {
      return geneStrand === "-" ? geneEnd - v.position + 1 : v.position - geneStart + 1;
    }
    return null;
  };

  const points = variants
    .filter(
      (v) =>
        v.function_score !== undefined &&
        v.function_score !== null &&
        getNucleotidePos(v) !== null,
    )
    .map((v) => ({
      nucleotidePos: getNucleotidePos(v)!,
      genomicPos:
        geneStrand === "-" && geneEnd != null
          ? geneEnd - getNucleotidePos(v)! + 1
          : geneStart + getNucleotidePos(v)! - 1,
      value: v.function_score!,
      variantId: v.id,
      hgvs: v.hgvs,
      ref: v.ref,
      alt: v.alt,
    }))
    .filter(
      (p) => p.genomicPos >= currentRegion.start && p.genomicPos <= currentRegion.stop,
    );

  const positions = [...new Set(points.map((p) => p.nucleotidePos))].sort(
    (a, b) => a - b,
  );

  const values = points.map((p) => p.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const valueRange = maxValue - minValue || 1;

  const scaleY = (value: number) => {
    const normalized = (maxValue - value) / valueRange;
    return padding + normalized * (height - 2 * padding);
  };

  const getColor = (score: number) => {
    if (score > 0) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL;
    if (score < -1) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG;
    return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE;
  };

  const groupKey = (p: (typeof points)[0]) => `${p.genomicPos}-${p.nucleotidePos}`;

  return (
    <Track title="Function Score">
      {({ scalePosition, width }) => (
        <svg
          key={`${currentRegion.start}-${currentRegion.stop}`}
          height={height}
          width={width}
          style={{ display: "block", overflow: "visible" }}
        >
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="white"
            stroke="#e5e7eb"
          />

          {values.length > 0 && (
            <>
              <text
                x={5}
                y={padding + 4}
                fontSize="10"
                fill="#6B7280"
                textAnchor="start"
              >
                {maxValue.toFixed(2)}
              </text>
              <text
                x={5}
                y={height - padding + 4}
                fontSize="10"
                fill="#6B7280"
                textAnchor="start"
              >
                {minValue.toFixed(2)}
              </text>
            </>
          )}

          {minValue < 0 && maxValue > 0 && (
            <line
              x1={0}
              y1={scaleY(0)}
              x2={width}
              y2={scaleY(0)}
              stroke="#d1d5db"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          )}

          {positions.map((pos) => {
            const posPoints = points.filter((p) => p.nucleotidePos === pos);
            const n = posPoints.length;
            const xCenter = scalePosition(posPoints[0].genomicPos);

            return posPoints.map((p, i) => {
              const offset = n === 1 ? 0 : ((i / (n - 1)) * 2 - 1) * jitterRange;
              return (
                <g key={groupKey(p)}>
                  <circle
                    cx={xCenter + offset}
                    cy={scaleY(p.value)}
                    r={4}
                    fill={getColor(p.value)}
                    stroke="white"
                    strokeWidth={1}
                  />
                  <title>
                    {`Position ${p.nucleotidePos}: Function Score = ${p.value.toFixed(3)}`}
                    {p.hgvs ? `\n${p.hgvs}` : ""}
                    {p.ref && p.alt ? `\n${p.ref}>${p.alt}` : ""}
                  </title>
                </g>
              );
            });
          })}
        </svg>
      )}
    </Track>
  );
};

export default FunctionScoreTrack;
