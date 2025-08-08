import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import type { RNAData } from '../../types/rna';

interface NucleotideInfoPanelProps {
  rnaData: RNAData;
  currentNucleotide: number | null;
  editingId: number | null;
  onUpdateNucleotideBase: (nucleotideId: number, newBase: 'A' | 'C' | 'G' | 'U') => void;
  onUpdateNucleotideId: (oldId: number, newId: number) => boolean;
  onSetEditingId: (id: number | null) => void;
}

const NucleotideInfoPanel: React.FC<NucleotideInfoPanelProps> = ({
  rnaData,
  currentNucleotide,
  editingId,
  onUpdateNucleotideBase,
  onUpdateNucleotideId,
  onSetEditingId
}) => {
  const handleIdUpdate = (newId: number) => {
    if (currentNucleotide) {
      const success = onUpdateNucleotideId(currentNucleotide, newId);
      if (!success) {
        alert('ID already exists!');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Nucleotide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentNucleotide && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">ID:</label>
              {editingId === currentNucleotide ? (
                <Input
                  type="number"
                  value={currentNucleotide}
                  onChange={(e) => {
                    const newId = parseInt(e.target.value);
                    if (!isNaN(newId) && newId > 0) {
                      handleIdUpdate(newId);
                    }
                  }}
                  onBlur={() => onSetEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSetEditingId(null);
                    }
                  }}
                  className="w-20 h-8"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-pointer underline"
                  onClick={() => onSetEditingId(currentNucleotide)}
                >
                  {currentNucleotide}
                </span>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Base:</label>
              <div className="flex gap-2">
                {(['A', 'U', 'G', 'C'] as const).map(base => {
                  const nucleotide = rnaData.nucleotides.find(n => n.id === currentNucleotide);
                  return (
                    <Button
                      key={base}
                      variant={nucleotide?.base === base ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onUpdateNucleotideBase(currentNucleotide, base)}
                      className="flex-1"
                    >
                      {base}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {!currentNucleotide && (
          <p className="text-sm text-gray-500">
            Click on a nucleotide to edit it
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NucleotideInfoPanel;