import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { RNAData } from '../../types/rna';

interface StructureInfoPanelProps {
  rnaData: RNAData;
  currentNucleotide: number | null;
}

const StructureInfoPanel: React.FC<StructureInfoPanelProps> = ({
  rnaData,
  currentNucleotide
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Structure Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>Nucleotides: {rnaData.nucleotides.length}</div>
          <div>Base Pairs: {rnaData.basePairs.length}</div>
          <div>Current: {currentNucleotide ? `#${currentNucleotide}` : 'None'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StructureInfoPanel;