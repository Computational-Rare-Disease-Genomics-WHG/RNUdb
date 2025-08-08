// src/components/RNAViewer/BasePairBond.tsx
import React from 'react';
import type { Nucleotide } from '../../types';
import { isWatsonCrickPair } from '../../lib/rnaUtils';

interface BasePairBondProps {
  from: Nucleotide;
  to: Nucleotide;
}

const BasePairBond: React.FC<BasePairBondProps> = ({ from, to }) => {
  const isWC = isWatsonCrickPair(from.base, to.base);

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="#666"
      strokeWidth="1"
      strokeDasharray={isWC ? "none" : "3,3"}
      opacity="0.6"
    />
  );
};

export default BasePairBond;