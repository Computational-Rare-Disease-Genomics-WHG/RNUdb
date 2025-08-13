// src/components/RNAViewer/NucleotideComponent.tsx
import React from 'react';
import type { Nucleotide } from '../../types';
import { COLORBLIND_FRIENDLY_PALETTE } from '../../lib/colors';

interface NucleotideComponentProps {
  nucleotide: Nucleotide;
  color: string;
  isHovered: boolean;
  isSelected: boolean;
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
  onHover, 
  onClick
}) => {
  return (
    <g className="nucleotide-group">
      <circle
        cx={nucleotide.x}
        cy={nucleotide.y}
        r={isHovered ? 20 : 18}
        fill={color}
        stroke={isSelected ? COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC : (isHovered ? COLORBLIND_FRIENDLY_PALETTE.PRIMARY : COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.DARK_GRAY)}
        strokeWidth={isSelected ? "3" : (isHovered ? "2" : "1")}
        onMouseEnter={() => onHover(nucleotide)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(nucleotide)}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease'
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