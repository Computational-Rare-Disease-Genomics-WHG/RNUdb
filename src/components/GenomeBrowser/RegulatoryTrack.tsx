// RegulatoryTrack.tsx
import React from 'react';
import { Track } from '@gnomad/region-viewer';
import { COLORBLIND_FRIENDLY_PALETTE } from '../../lib/colors';

interface RegulatoryElement {
  id: string;
  type: string;
  start: number;
  stop: number;
  score: number;
  source: string;
  factor?: string;
}

interface RegulatoryTrackProps {
  regions: Array<{ start: number; stop: number }>;
}

const mockRegulatoryElements: RegulatoryElement[] = [
  {
    id: 'enhancer_1',
    type: 'enhancer',
    start: 6648900,
    stop: 6648930,
    score: 85,
    source: 'ENCODE'
  },
  {
    id: 'promoter_1',
    type: 'promoter',
    start: 6648940,
    stop: 6648960,
    score: 92,
    source: 'EPD'
  },
  {
    id: 'tfbs_1',
    type: 'transcription_factor_binding_site',
    start: 6649050,
    stop: 6649065,
    score: 78,
    source: 'ChIP-seq',
    factor: 'POU2F1'
  }
];

const RegulatoryTrack: React.FC<RegulatoryTrackProps> = ({ regions }) => {
  const height = 40;
  
  if (regions.length === 0) return null;

  const visibleElements = mockRegulatoryElements.filter(
    elem => elem.start >= regions[0].start && elem.stop <= regions[0].stop
  );

  return (
    <Track title="Regulatory Elements">
      {({ scalePosition, width }) => (
        <svg height={height} width={width}>
          <rect width={width} height={height} fill="#fefefe" className="regulatory-track" />
          {visibleElements.map((element) => {
            const x1 = scalePosition(element.start);
            const x2 = scalePosition(element.stop);
            const color = COLORBLIND_FRIENDLY_PALETTE.REGULATORY[element.type.toUpperCase() as keyof typeof COLORBLIND_FRIENDLY_PALETTE.REGULATORY] || COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.MEDIUM_GRAY;
            
            return (
              <g key={element.id}>
                <rect
                  x={x1}
                  y={height / 2 - 8}
                  width={x2 - x1}
                  height={16}
                  fill={color}
                  className="regulatory-element"
                  rx={2}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={height / 2 + 3}
                  className="regulatory-label"
                >
                  {element.type === 'transcription_factor_binding_site' ? 'TFBS' : element.type.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Track>
  );
};

export default RegulatoryTrack;