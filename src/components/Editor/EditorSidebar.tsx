import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Move, 
  Plus, 
  Link, 
  Trash2, 
  Edit3, 
  Keyboard, 
  Target,
  BarChart3
} from 'lucide-react';
import type { RNAData } from '../../types/rna';

interface EditorSidebarProps {
  rnaData: RNAData;
  mode: 'select' | 'add' | 'pair' | 'delete';
  currentNucleotide: number | null;
  editingId: number | null;
  onModeChange: (mode: 'select' | 'add' | 'pair' | 'delete') => void;
  onUpdateNucleotideBase: (nucleotideId: number, newBase: 'A' | 'C' | 'G' | 'U') => void;
  onUpdateNucleotideId: (oldId: number, newId: number) => boolean;
  onSetEditingId: (id: number | null) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  rnaData,
  mode,
  currentNucleotide,
  editingId,
  onModeChange,
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

  const getBaseStats = () => {
    const bases = rnaData.nucleotides.reduce((acc, nuc) => {
      if (nuc.base) {
        acc[nuc.base] = (acc[nuc.base] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return { A: bases.A || 0, U: bases.U || 0, G: bases.G || 0, C: bases.C || 0 };
  };

  const baseStats = getBaseStats();

  return (
    <div className="space-y-6">
      {/* Tools Panel */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Edit3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Editor Tools
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Select a tool to edit your RNA structure
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('select')}
              className={mode === 'select' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              <Move className="h-4 w-4 mr-2" />
              Select
            </Button>
            <Button
              variant={mode === 'add' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('add')}
              className={mode === 'add' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            <Button
              variant={mode === 'pair' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('pair')}
              className={mode === 'pair' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              <Link className="h-4 w-4 mr-2" />
              Pair
            </Button>
            <Button
              variant={mode === 'delete' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => onModeChange('delete')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 leading-relaxed">
              {mode === 'select' && "Click and drag nucleotides to move them around"}
              {mode === 'add' && "Click anywhere on the canvas to add a nucleotide"}
              {mode === 'pair' && "Click two nucleotides to create or remove a base pair"}
              {mode === 'delete' && "Click on nucleotides to delete them"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Nucleotide Panel */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Current Nucleotide
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentNucleotide ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">ID:</label>
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
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => onSetEditingId(currentNucleotide)}
                  >
                    #{currentNucleotide}
                  </Badge>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['A', 'U', 'G', 'C'] as const).map(base => {
                    const nucleotide = rnaData.nucleotides.find(n => n.id === currentNucleotide);
                    const isSelected = nucleotide?.base === base;
                    return (
                      <Button
                        key={base}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onUpdateNucleotideBase(currentNucleotide, base)}
                        className={isSelected ? 'bg-teal-600 hover:bg-teal-700' : ''}
                      >
                        {base}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No nucleotide selected
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click on a nucleotide to edit it
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structure Statistics */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Structure Statistics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rnaData.nucleotides.length}</div>
                <div className="text-sm text-gray-500">Nucleotides</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rnaData.basePairs.length}</div>
                <div className="text-sm text-gray-500">Base Pairs</div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-700 mb-2">Base Composition:</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(baseStats).map(([base, count]) => (
                  <div key={base} className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {base}
                    </Badge>
                    <span className="text-sm font-mono text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Keyboard className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Keyboard Shortcuts
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Add nucleotide</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">N</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Set base</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">A/C/G/U</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Navigate</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">↑↓←→</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Delete</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Del</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Clear selection</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditorSidebar;