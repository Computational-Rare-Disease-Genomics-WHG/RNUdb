
import React from 'react';
import { Track } from '@gnomad/region-viewer';

interface GenericTrackProps {
  title: string;
  height: number;
  data: {
    [key: number]: {
      value: number;
      label?: string;
      color?: string;
    };
  };
  regions: { start: number; stop: number }[];
  displayType?: 'bars' | 'line';
  geneStart: number;
}

const GenericTrack: React.FC<GenericTrackProps> = ({ title, height, data, regions, displayType = 'bars', geneStart }) => {
  const currentRegion = regions[0];

  return (
    <Track title={title}>
      {({ scalePosition, width }) => {
        // Get filtered and sorted data points
        const dataPoints = Object.entries(data)
          .map(([nucleotide, item]) => ({
            nucleotide: parseInt(nucleotide),
            genomicPos: geneStart + parseInt(nucleotide) - 1,
            ...item
          }))
          .filter(point => point.genomicPos >= currentRegion.start && point.genomicPos <= currentRegion.stop)
          .sort((a, b) => a.genomicPos - b.genomicPos);

        // Calculate y-scale for line graph
        const values = dataPoints.map(p => p.value);
        const minValue = values.length > 0 ? Math.min(...values) : 0;
        const maxValue = values.length > 0 ? Math.max(...values) : 0;
        const valueRange = maxValue - minValue || 1;
        const padding = 15;
        
        const scaleY = (value: number) => {
          const normalized = (maxValue - value) / valueRange; // Flip for proper orientation
          return padding + (normalized * (height - 2 * padding));
        };

        return (
          <svg height={height} width={width}>
            {/* Background */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="white"
              stroke="#e5e7eb"
            />

            {/* Y-axis labels for both line and bar graphs */}
            {values.length > 0 && (
              <>
                <text x={5} y={padding + 4} fontSize="10" fill="#6B7280" textAnchor="start">
                  {maxValue.toFixed(2)}
                </text>
                <text x={5} y={height - padding + 4} fontSize="10" fill="#6B7280" textAnchor="start">
                  {minValue.toFixed(2)}
                </text>
              </>
            )}

            {/* Zero line for function scores */}
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

            {displayType === 'line' ? (
              /* Line Graph */
              <>
                {/* Draw line connecting points */}
                {dataPoints.length > 1 && (
                  <polyline
                    points={dataPoints
                      .map(point => `${scalePosition(point.genomicPos)},${scaleY(point.value)}`)
                      .join(' ')
                    }
                    fill="none"
                    stroke="#374151"
                    strokeWidth={1.5}
                  />
                )}
                
                {/* Draw data points */}
                {dataPoints.map(point => (
                  <g key={`track-item-${point.genomicPos}`}>
                    <circle
                      cx={scalePosition(point.genomicPos)}
                      cy={scaleY(point.value)}
                      r={2}
                      fill={point.color || '#374151'}
                      stroke="white"
                      strokeWidth={0.5}
                    />
                    <title>
                      {`Nucleotide ${point.nucleotide}: ${point.label || point.value}`}
                    </title>
                  </g>
                ))}
              </>
            ) : (
              /* Bar Graph */
              dataPoints.map(point => {
                const barHeight = Math.abs(scaleY(point.value) - scaleY(Math.max(0, minValue)));
                const barY = minValue < 0 && point.value < 0 
                  ? scaleY(Math.max(0, minValue)) // Negative values go down from zero line
                  : scaleY(point.value); // Positive values go up from zero/min line
                
                return (
                  <g key={`track-item-${point.genomicPos}`}>
                    <rect
                      x={scalePosition(point.genomicPos) - 2}
                      y={barY}
                      width={4}
                      height={barHeight}
                      fill={point.color || 'gray'}
                      stroke={point.color || 'gray'}
                      rx={1}
                    />
                    <title>
                      {`Nucleotide ${point.nucleotide}: ${point.label || point.value}`}
                    </title>
                  </g>
                );
              })
            )}
          </svg>
        );
      }}
    </Track>
  );
};

export default GenericTrack;
