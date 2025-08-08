import React from 'react';
import { Track } from '@gnomad/region-viewer';
import { variantData, createFunctionScoreOverlayData } from '../../data/variantData';
import { sgeData, createFunctionScoreOverlayData as createSGEFunctionScoreOverlayData } from '../../data/sgeData';
import { COLORBLIND_FRIENDLY_PALETTE } from '../../lib/colors';

interface FunctionScoreTrackProps {
  regions: { start: number; stop: number }[];
}

const FunctionScoreTrack: React.FC<FunctionScoreTrackProps> = ({ regions }) => {
  const currentRegion = regions[0];
  
  // Create function score overlay data from SGE data and clinical variants
  const sgeFunctionScoreOverlay = createSGEFunctionScoreOverlayData(sgeData);
  const clinicalFunctionScoreOverlay = createFunctionScoreOverlayData(variantData);
  
  // Combine SGE and clinical data, with SGE taking precedence
  const functionScoreOverlay = { ...clinicalFunctionScoreOverlay, ...sgeFunctionScoreOverlay };
  
  // Filter for current region and RNU4-2 (nucleotides 1-146)
  const nucleotideScores = Object.fromEntries(
    Object.entries(functionScoreOverlay).filter(([nucleotide, score]) => {
      const nucId = parseInt(nucleotide);
      return nucId >= 1 && nucId <= 146 && score !== null;
    })
  );

  const trackHeight = 80;
  const marginTop = 10;
  const marginBottom = 10;
  const plotHeight = trackHeight - marginTop - marginBottom;

  // Get min/max scores for scaling
  const scores = Object.values(nucleotideScores);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 0);
  const scoreRange = maxScore - minScore;

  return (
    <Track title="Function Score">
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
          
          {/* Zero line */}
          <line
            x1={0}
            x2={width}
            y1={marginTop + (maxScore / scoreRange) * plotHeight}
            y2={marginTop + (maxScore / scoreRange) * plotHeight}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          
          {/* Grid lines */}
          {[-0.2, -0.1, 0.1, 0.2].map(value => {
            if (value >= minScore && value <= maxScore) {
              const y = marginTop + ((maxScore - value) / scoreRange) * plotHeight;
              return (
                <line
                  key={value}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
              );
            }
            return null;
          })}
          
          {/* Function score bars */}
          {Object.entries(nucleotideScores).map(([nucleotide, score]) => {
            // Convert nucleotide position to genomic coordinates
            // RNU4-2 starts at position 6648956, so nucleotide 1 = 6648956
            const genomicPos = 6648956 + parseInt(nucleotide) - 1;
            
            if (genomicPos < currentRegion.start || genomicPos > currentRegion.stop) {
              return null;
            }
            
            const x = scalePosition(genomicPos);
            const barHeight = Math.abs(score / scoreRange) * plotHeight;
            const barY = score >= 0 
              ? marginTop + ((maxScore - score) / scoreRange) * plotHeight
              : marginTop + (maxScore / scoreRange) * plotHeight;
            
            const color = score > 0 
              ? COLORBLIND_FRIENDLY_PALETTE.FUNCTION_SCORE.POSITIVE 
              : COLORBLIND_FRIENDLY_PALETTE.FUNCTION_SCORE.NEGATIVE;
            
            return (
              <g key={`function-score-${genomicPos}`}>
                <rect
                  x={x - 1}
                  y={barY}
                  width={2}
                  height={barHeight}
                  fill={color}
                  stroke={color}
                />
                <title>
                  {`Nucleotide ${nucleotide}: Function Score ${score.toFixed(3)}`}
                </title>
              </g>
            );
          })}
          
          {/* Y-axis labels */}
          <text
            x={5}
            y={marginTop + 5}
            fontSize="10"
            fill="#64748b"
            textAnchor="start"
          >
            {maxScore.toFixed(2)}
          </text>
          <text
            x={5}
            y={trackHeight - 5}
            fontSize="10"
            fill="#64748b"
            textAnchor="start"
          >
            {minScore.toFixed(2)}
          </text>
        </svg>
      )}
    </Track>
  );
};

export default FunctionScoreTrack;