// src/components/RNAViewer/NucleotideComponent.tsx
import React from "react";
import { COLORBLIND_FRIENDLY_PALETTE } from "../../lib/colors";
import type { Nucleotide } from "../../types";

interface NucleotideComponentProps {
  nucleotide: Nucleotide;
  color: string;
  isHovered: boolean;
  isSelected: boolean;
  isHighlighted?: boolean;
  onHover: (nucleotide: Nucleotide | null) => void;
  onClick: (nucleotide: Nucleotide) => void;
  hasVariants?: boolean;
  variantCount?: number;
}

const NucleotideComponent: React.FC<NucleotideComponentProps> = ({
  nucleotide,
  color,
  isHovered,
  isSelected,
  isHighlighted = false,
  onHover,
  onClick,
}) => {
  // Determine visual state priority: selected > highlighted > hovered > default
  const getStrokeColor = () => {
    if (isSelected) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC;
    if (isHighlighted) return "#6366f1"; // Indigo for linked variant highlight
    if (isHovered) return COLORBLIND_FRIENDLY_PALETTE.PRIMARY;
    return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.DARK_GRAY;
  };

  const getStrokeWidth = () => {
    if (isSelected) return "3";
    if (isHighlighted) return "4"; // Thicker stroke for highlighted
    if (isHovered) return "2";
    return "1";
  };

  const getRadius = () => {
    if (isSelected) return 20;
    if (isHighlighted) return 22; // Larger for highlighted
    if (isHovered) return 20;
    return 18;
  };

  return (
    <g className="nucleotide-group">
      {/* Outer glow ring for highlighted nucleotides */}
      {isHighlighted && (
        <circle
          cx={nucleotide.x}
          cy={nucleotide.y}
          r={28}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          opacity="0.3"
          pointerEvents="none"
          style={{
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}

      <circle
        cx={nucleotide.x}
        cy={nucleotide.y}
        r={getRadius()}
        fill={color}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        onMouseEnter={() => onHover(nucleotide)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(nucleotide)}
        style={{
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      />

      <text
        x={nucleotide.x}
        y={nucleotide.y + 4}
        textAnchor="middle"
        fontSize="16"
        fill={COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.DARK_GRAY}
        fontWeight="bold"
        pointerEvents="none"
      >
        {nucleotide.base}
      </text>
    </g>
  );
};

export default NucleotideComponent;
