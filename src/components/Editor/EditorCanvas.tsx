import React, { useRef, useCallback, forwardRef } from 'react';
import type { RNAData, Nucleotide } from '../../types/rna';

interface EditorCanvasProps {
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
}

const EditorCanvas = forwardRef<HTMLDivElement, EditorCanvasProps>(({
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
  onNucleotideMouseDown
}, ref) => {

  const renderBasePairs = useCallback(() => {
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
  }, [rnaData.basePairs, rnaData.nucleotides]);

  const renderNucleotides = useCallback(() => {
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
            stroke={isCurrent ? "#8b5cf6" : isSelected ? "#6366f1" : "#374151"}
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
            className="pointer-events-none"
          >
            {displayText}
          </text>
          {isCurrent && (
            <circle
              cx={nucleotide.x + 15}
              cy={nucleotide.y + 15}
              r="18"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="3,3"
              className="pointer-events-none"
            />
          )}
        </g>
      );
    });
  }, [rnaData.nucleotides, selectedNucleotides, currentNucleotide, onNucleotideClick, onNucleotideMouseDown]);

  return (
    <div 
      ref={ref}
      className="border-2 border-gray-300 rounded-lg relative bg-white overflow-hidden"
      style={{ 
        width: '100%', 
        height: '500px',
        cursor: isPanning ? 'grabbing' : (mode === 'select' ? 'grab' : 'crosshair')
      }}
      onClick={onCanvasClick}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      tabIndex={0}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${Math.max(2000, Math.max(...rnaData.nucleotides.map(n => n.x), 0) + 100)} ${Math.max(1000, Math.max(...rnaData.nucleotides.map(n => n.y), 0) + 100)}`}
        className="absolute inset-0 pointer-events-none"
        style={{ 
          pointerEvents: 'none',
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          transformOrigin: 'top left'
        }}
      >
        {renderBasePairs()}
        <g style={{ pointerEvents: 'auto' }}>
          {renderNucleotides()}
        </g>
      </svg>
    </div>
  );
});

EditorCanvas.displayName = 'EditorCanvas';

export default EditorCanvas;