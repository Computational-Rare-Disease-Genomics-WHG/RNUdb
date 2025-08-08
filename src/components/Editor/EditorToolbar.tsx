import React from 'react';
import { Button } from '../ui/button';
import { Move, Plus, Link, Trash2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface EditorToolbarProps {
  mode: 'select' | 'add' | 'pair' | 'delete';
  zoomLevel: number;
  onModeChange: (mode: 'select' | 'add' | 'pair' | 'delete') => void;
  onZoom: (delta: number) => void;
  onResetView: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  mode,
  zoomLevel,
  onModeChange,
  onZoom,
  onResetView
}) => {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <Button
        variant={mode === 'select' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('select')}
      >
        <Move className="h-4 w-4 mr-1" />
        Select & Move
      </Button>
      <Button
        variant={mode === 'add' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('add')}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Nucleotide
      </Button>
      <Button
        variant={mode === 'pair' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('pair')}
      >
        <Link className="h-4 w-4 mr-1" />
        Add/Remove Pairs
      </Button>
      <Button
        variant={mode === 'delete' ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => onModeChange('delete')}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
      
      {/* Zoom Controls */}
      <div className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1">
          <Button 
            onClick={() => onZoom(0.1)} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button 
            onClick={() => onZoom(-0.1)} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button 
            onClick={onResetView} 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <span className="text-xs text-slate-600 ml-2">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
        <div className="text-xs text-slate-600">
          {mode === 'select' ? 'Click and drag to pan, or drag nucleotides' : 'Use zoom controls to navigate large structures'}
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;