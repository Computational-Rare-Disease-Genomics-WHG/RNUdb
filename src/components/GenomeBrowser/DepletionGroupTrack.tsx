import React from 'react';
import { Track } from '@gnomad/region-viewer';
import { sgeData, createDepletionGroupOverlayData as createSGEDepletionGroupOverlayData } from '../../data/sgeData';
import { COLORBLIND_FRIENDLY_PALETTE } from '../../lib/colors';

interface DepletionGroupTrackProps {
  regions: { start: number; stop: number }[];
}

const DepletionGroupTrack: React.FC<DepletionGroupTrackProps> = ({ regions }) => {
  const currentRegion = regions[0];
  
  // Create depletion group overlay data from SGE data and clinical variants
  const sgeDepletionGroupOverlay = createSGEDepletionGroupOverlayData(sgeData);
  // const clinicalDepletionGroupOverlay = createDepletionGroupOverlayData(variantData);
  
  // Combine SGE and clinical data, with SGE taking precedence
  const depletionGroupOverlay = {  ...sgeDepletionGroupOverlay };
  
  // Filter for current region and RNU4-2 (nucleotides 1-146) and convert back to string labels
  const nucleotideGroups = Object.fromEntries(
    Object.entries(depletionGroupOverlay)
      .filter(([nucleotide, value]) => {
        const nucId = parseInt(nucleotide);
        return nucId >= 1 && nucId <= 146 && value !== null;
      })
      .map(([nucleotide, value]) => {
        // Convert numeric value back to string label
        const group = value === 3 ? 'strong' : 
                     value === 2 ? 'moderate' : 
                     value === 1 ? 'normal' : 'unknown';
        return [parseInt(nucleotide), group];
      })
  );

  const trackHeight = 30;
  const barHeight = 20;
  const marginTop = 5;

  const getColor = (group: string) => {
    switch (group) {
      case 'strong':
        return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG;
      case 'moderate':
        return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE;
      case 'normal':
        return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL;
      default:
        return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    }
  };

  return (
    <Track title="Depletion Group">
      {({ scalePosition, width }) => (
        <svg height={trackHeight} width={width}>
          {/* Background */}
          <rect 
            x={0} 
            y={0} 
            width={width} 
            height={trackHeight} 
            fill="white" 
            stroke="#e5e7eb" 
          />
          
          {/* Depletion group markers */}
          {Object.entries(nucleotideGroups).map(([nucleotide, group]) => {
            // Convert nucleotide position to genomic coordinates
            // RNU4-2 starts at position 6648956, so nucleotide 1 = 6648956
            const genomicPos = 6648956 + parseInt(nucleotide) - 1;
            
            if (genomicPos < currentRegion.start || genomicPos > currentRegion.stop) {
              return null;
            }
            
            const x = scalePosition(genomicPos);
            const color = getColor(group);
            
            return (
              <g key={`depletion-group-${genomicPos}`}>
                <rect
                  x={x - 2}
                  y={marginTop}
                  width={4}
                  height={barHeight}
                  fill={color}
                  stroke={color}
                  rx={1}
                />
                <title>
                  {`Nucleotide ${nucleotide}: ${group.charAt(0).toUpperCase() + group.slice(1)} depletion`}
                </title>
              </g>
            );
          })}
          
        </svg>
      )}
    </Track>
  );
};

export default DepletionGroupTrack;