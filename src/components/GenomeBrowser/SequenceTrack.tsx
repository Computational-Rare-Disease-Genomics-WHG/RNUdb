// SequenceTrack.tsx
import React from 'react';
import { Track } from '@gnomad/region-viewer';
import { COLORBLIND_FRIENDLY_PALETTE } from '../../lib/colors';

interface SequenceBase {
  position: number;
  seq: string;
}

interface SequenceTrackProps {
  regions: Array<{ start: number; stop: number }>;
}

const generateSequenceData = (start: number, end: number): SequenceBase[] => {
  const bases = ['A', 'C', 'G', 'T'];
  const sequence = [];
  for (let i = start; i <= end; i++) {
    sequence.push({
      position: i,
      seq: bases[Math.floor(Math.random() * bases.length)]
    });
  }
  return sequence;
};

const SequenceTrack: React.FC<SequenceTrackProps> = ({ regions }) => {
  const height = 30;
  
  if (regions.length === 0 || regions[0].stop - regions[0].start > 500) {
    return null;
  }

  const sequence = generateSequenceData(regions[0].start, regions[0].stop);

  return (
    <Track title="Reference Sequence">
      {({ scalePosition, width }) => (
        <svg height={height} width={width}>
          <rect width={width} height={height} fill="#f8fafc" className="sequence-track" />
          {sequence.map((base) => {
            const x = scalePosition(base.position);
            const baseColor = COLORBLIND_FRIENDLY_PALETTE.DNA_BASES[base.seq as keyof typeof COLORBLIND_FRIENDLY_PALETTE.DNA_BASES] || COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.MEDIUM_GRAY;
            
            return (
              <text
                key={base.position}
                x={x}
                y={height - 6}
                className="sequence-base"
                fill={baseColor}
              >
                {base.seq}
              </text>
            );
          })}
        </svg>
      )}
    </Track>
  );
};

export default SequenceTrack;