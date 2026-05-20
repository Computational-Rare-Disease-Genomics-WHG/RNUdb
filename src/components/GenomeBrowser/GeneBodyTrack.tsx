import { Track } from "@gnomad/region-viewer";
import React from "react";
import { COLORBLIND_FRIENDLY_PALETTE } from "../../lib/colors";

interface GeneBodyTrackProps {
  geneStart: number;
  geneEnd: number;
  geneName: string;
  regions: { start: number; stop: number }[];
}

const GeneBodyTrack: React.FC<GeneBodyTrackProps> = ({
  geneStart,
  geneEnd,
  geneName,
  regions,
}) => {
  const height = 28;
  const currentRegion = regions[0];

  const isVisible = geneStart <= currentRegion.stop && geneEnd >= currentRegion.start;

  if (!isVisible) return null;

  return (
    <Track title="Gene">
      {({ scalePosition, width }) => {
        const x1 = scalePosition(geneStart);
        const x2 = scalePosition(geneEnd);
        const lineWidth = Math.max(x2 - x1, 2);
        const midY = height / 2;

        return (
          <svg height={height} width={width}>
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#fafafa"
              stroke="#e5e7eb"
            />
            <line
              x1={x1}
              y1={midY}
              x2={x2}
              y2={midY}
              stroke={COLORBLIND_FRIENDLY_PALETTE.GENES.SNRNA}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {lineWidth > 20 && (
              <rect
                x={x1}
                y={midY - 6}
                width={lineWidth}
                height={12}
                fill={COLORBLIND_FRIENDLY_PALETTE.GENES.SNRNA}
                fillOpacity={0.15}
                stroke={COLORBLIND_FRIENDLY_PALETTE.GENES.SNRNA}
                strokeWidth={1.5}
                rx={3}
                ry={3}
              />
            )}
            {lineWidth > 40 && (
              <text
                x={x1 + lineWidth / 2}
                y={midY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fill={COLORBLIND_FRIENDLY_PALETTE.GENES.SNRNA}
                fontWeight={600}
              >
                {geneName}
              </text>
            )}
            <title>{`${geneName} (${geneStart.toLocaleString()}-${geneEnd.toLocaleString()})`}</title>
          </svg>
        );
      }}
    </Track>
  );
};

export default GeneBodyTrack;
