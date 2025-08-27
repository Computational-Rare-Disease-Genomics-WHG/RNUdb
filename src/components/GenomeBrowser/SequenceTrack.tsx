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
  geneSequence: string;
  geneStart: number;
}

const getSequenceData = (regions: { start: number; stop: number }, geneSequence: string, geneStart: number): SequenceBase[] => {
  const sequence = [];
  const regionStart = Math.max(regions.start, geneStart);
  const regionEnd = Math.min(regions.stop, geneStart + geneSequence.length - 1);
  
  for (let pos = regionStart; pos <= regionEnd; pos++) {
    const relativePos = pos - geneStart;
    if (relativePos >= 0 && relativePos < geneSequence.length) {
      sequence.push({
        position: pos,
        seq: geneSequence[relativePos].toUpperCase()
      });
    }
  }
  return sequence;
};

const SequenceTrack: React.FC<SequenceTrackProps> = ({ regions, geneSequence, geneStart }) => {
  const height = 30;
  
  if (regions.length === 0 || regions[0].stop - regions[0].start > 500) {
    return null;
  }

  const sequence = getSequenceData(regions[0], geneSequence, geneStart);

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