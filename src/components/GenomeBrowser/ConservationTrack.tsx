// ConservationTrack.tsx
import React from 'react';
import { Track } from '@gnomad/region-viewer';

interface ConservationPoint {
  position: number;
  score: number;
}

interface ConservationTrackProps {
  regions: Array<{ start: number; stop: number }>;
}

const generateConservationData = (start: number, end: number): ConservationPoint[] => {
  const conservation = [];
  for (let i = start; i <= end; i++) {
    conservation.push({
      position: i,
      score: Math.random() * 100 // Conservation score 0-100
    });
  }
  return conservation;
};

const ConservationTrack: React.FC<ConservationTrackProps> = ({ regions }) => {
  const height = 60;
  
  if (regions.length === 0) return null;

  const conservation = generateConservationData(regions[0].start, regions[0].stop);

  return (
    <Track title="PhyloP Conservation">
      {({ scalePosition, width }) => {
        return (
          <svg height={height} width={width}>
            <rect width={width} height={height} fill="#ffffff" className="conservation-track" />
            {/* Grid lines */}
            {[25, 50, 75].map(y => (
              <line
                key={y}
                x1={0}
                y1={height - (y / 100) * (height - 10)}
                x2={width}
                y2={height - (y / 100) * (height - 10)}
                className="conservation-grid-line"
              />
            ))}
            {/* Conservation bars */}
            {conservation.map((point, i) => {
              const x = scalePosition(point.position);
              const barHeight = (point.score / 100) * (height - 10);
              // Grayscale conservation - no colors
              const grayIntensity = Math.max(0.2, point.score / 100);
              
              return (
                <rect
                  key={point.position}
                  x={x - 1}
                  y={height - barHeight}
                  width={2}
                  height={barHeight}
                  fill={`rgba(107, 114, 128, ${grayIntensity})`}
                  className="conservation-bar"
                />
              );
            })}
            {/* Y-axis labels */}
            <text x={5} y={15} className="conservation-label">100</text>
            <text x={5} y={height - 5} className="conservation-label">0</text>
          </svg>
        );
      }}
    </Track>
  );
};

export default ConservationTrack;