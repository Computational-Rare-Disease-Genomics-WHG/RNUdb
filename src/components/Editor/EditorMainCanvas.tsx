import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Palette, Grid, Eye } from 'lucide-react';
import type { RNAData } from '../../types/rna';

interface EditorMainCanvasProps {
  rnaData: RNAData;
  mode: 'select' | 'add' | 'pair' | 'delete';
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  draggedNucleotide: number | null;
  selectedNucleotides: number[];
  currentNucleotide: number | null;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onNucleotideClick: (e: React.MouseEvent, nucleotideId: number) => void;
  onNucleotideMouseDown: (e: React.MouseEvent, nucleotideId: number) => void;
  onZoom: (delta: number) => void;
  onResetView: () => void;
}

const EditorMainCanvas = forwardRef<HTMLDivElement, EditorMainCanvasProps>(({
  rnaData,
  mode,
  zoomLevel,
  panOffset,
  isPanning,
  selectedNucleotides,
  currentNucleotide,
  onCanvasClick,
  onCanvasMouseDown,
  onMouseMove,
  onMouseUp,
  onNucleotideClick,
  onNucleotideMouseDown,
  onZoom,
  onResetView
}, ref) => {
  const renderBasePairs = () => {
    return rnaData.basePairs.map((bp, index) => {
      const nucleotide1 = rnaData.nucleotides.find(n => n.id === bp.from);
      const nucleotide2 = rnaData.nucleotides.find(n => n.id === bp.to);
      
      if (!nucleotide1 || !nucleotide2) return null;
      
      return (
        <line
          key={index}
          x1={nucleotide1.x + 15}
          y1={nucleotide1.y + 15}
          x2={nucleotide2.x + 15}
          y2={nucleotide2.y + 15}
          stroke="#64748b"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      );
    });
  };

  const renderNucleotides = () => {
    return rnaData.nucleotides.map((nucleotide) => {
      const isSelected = selectedNucleotides.includes(nucleotide.id);
      const isCurrent = currentNucleotide === nucleotide.id;
      const baseColors = {
        'A': '#ef4444',
        'U': '#3b82f6',
        'G': '#10b981',
        'C': '#f59e0b'
      };
      
      const fillColor = nucleotide.base ? baseColors[nucleotide.base] : '#9ca3af';
      const displayText = nucleotide.base || nucleotide.id.toString();
      
      return (
        <g key={nucleotide.id}>
          <circle
            cx={nucleotide.x + 15}
            cy={nucleotide.y + 15}
            r="15"
            fill={fillColor}
            stroke={isCurrent ? "#0d9488" : isSelected ? "#0891b2" : "#374151"}
            strokeWidth={isCurrent ? "4" : isSelected ? "3" : "2"}
            className="cursor-pointer"
            onMouseDown={(e) => onNucleotideMouseDown(e, nucleotide.id)}
            onClick={(e) => onNucleotideClick(e, nucleotide.id)}
          />
          <text
            x={nucleotide.x + 15}
            y={nucleotide.y + 20}
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            {displayText}
          </text>
          {isCurrent && (
            <circle
              cx={nucleotide.x + 15}
              cy={nucleotide.y + 15}
              r="18"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
              strokeDasharray="3,3"
              className="pointer-events-none"
            />
          )}
        </g>
      );
    });
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Palette className="h-5 w-5 text-teal-600" />
              RNA Structure Canvas
            </CardTitle>
            <CardDescription className="mt-1">
              Interactive editor for designing RNA secondary structures
            </CardDescription>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
              <Button 
                onClick={() => onZoom(0.1)} 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-slate-200"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => onZoom(-0.1)} 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-slate-200"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                onClick={onResetView} 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-slate-600 font-medium px-2">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Mode: <span className="font-semibold capitalize text-slate-900">{mode}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Grid className="h-4 w-4" />
              <span>Snap: <span className="font-semibold text-slate-900">On</span></span>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {isPanning ? 'Panning...' : `${rnaData.nucleotides.length} nucleotides, ${rnaData.basePairs.length} pairs`}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div 
          ref={ref}
          className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden shadow-inner"
          style={{ 
            width: '100%', 
            height: '600px',
            cursor: isPanning ? 'grabbing' : (mode === 'select' ? 'grab' : 'crosshair')
          }}
          onClick={onCanvasClick}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          tabIndex={0}
        >
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" className="pointer-events-none">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f172a" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Main SVG Canvas */}
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${Math.max(rnaData.canvasWidth || 2000, Math.max(...rnaData.nucleotides.map(n => n.x), 0) + 100)} ${Math.max(rnaData.canvasHeight || 2000, Math.max(...rnaData.nucleotides.map(n => n.y), 0) + 100)}`}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              pointerEvents: 'none',
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: 'top left'
            }}
          >
            {/* Bonds Layer */}
            <g className="bonds-layer">
              {renderBasePairs()}
            </g>
            
            {/* Nucleotides Layer */}
            <g className="nucleotides-layer" style={{ pointerEvents: 'auto' }}>
              {renderNucleotides()}
            </g>
            
            {/* Annotations Layer */}
            <g className="annotations-layer">
              {rnaData.annotations?.map(annotation => (
                <text
                  key={annotation.id}
                  x={annotation.x}
                  y={annotation.y}
                  fontSize={annotation.fontSize}
                  fill={annotation.color || '#374151'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none font-medium"
                >
                  {annotation.text}
                </text>
              ))}
            </g>
          </svg>
          
          {/* Floating Help Text */}
          {rnaData.nucleotides.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                <Palette className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Start Creating</h3>
                <p className="text-sm text-slate-600 max-w-sm">
                  Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">N</kbd> to add your first nucleotide or click the Add tool and click on the canvas
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EditorMainCanvas.displayName = 'EditorMainCanvas';

export default EditorMainCanvas;