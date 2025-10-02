import React, { forwardRef, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Plus,
  Link,
  Trash2,
  Keyboard,
  Target,
  X,
  Type,
  MousePointer2,
  Shapes
} from 'lucide-react';
import type { RNAData } from '../../types/rna';

interface FullscreenCanvasProps {
  rnaData: RNAData;
  mode: 'select' | 'add' | 'pair' | 'delete' | 'label' | 'pan' | 'feature';
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  draggedNucleotide: number | null;
  selectedNucleotides: number[];
  currentNucleotide: number | null;
  currentLabel: string | null;
  editingId: number | null;
  isLabelModalOpen: boolean;
  selectedFeatureNucleotides: number[];
  isFeatureModalOpen: boolean;
  editingFeature: string | null;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onNucleotideClick: (e: React.MouseEvent, nucleotideId: number) => void;
  onNucleotideMouseDown: (e: React.MouseEvent, nucleotideId: number) => void;
  onLabelClick: (e: React.MouseEvent, labelId: string) => void;
  onZoom: (delta: number) => void;
  onResetView: () => void;
  onModeChange: (mode: 'select' | 'add' | 'pair' | 'delete' | 'label' | 'pan' | 'feature') => void;
  onUpdateNucleotideBase: (nucleotideId: number, newBase: 'A' | 'C' | 'G' | 'U') => void;
  onUpdateNucleotideId: (oldId: number, newId: number) => boolean;
  onSetEditingId: (id: number | null) => void;
  onUpdateRnaData: (data: RNAData) => void;
  onSetLabelModalOpen: (isOpen: boolean) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onFeatureNucleotideToggle: (nucleotideId: number) => void;
  onFeatureLabelClick: (e: React.MouseEvent, featureId: string) => void;
  onOpenFeatureModal: () => void;
  onSetFeatureModalOpen: (isOpen: boolean) => void;
}

const FullscreenCanvas = forwardRef<HTMLDivElement, FullscreenCanvasProps>(({
  rnaData,
  mode,
  zoomLevel,
  panOffset,
  isPanning,
  selectedNucleotides,
  currentNucleotide,
  currentLabel,
  editingId,
  isLabelModalOpen,
  selectedFeatureNucleotides,
  onCanvasClick,
  onCanvasMouseDown,
  onMouseMove,
  onMouseUp,
  onNucleotideClick,
  onNucleotideMouseDown,
  onLabelClick,
  onZoom,
  onResetView,
  onModeChange,
  onUpdateNucleotideBase,
  onUpdateNucleotideId,
  onSetEditingId,
  onUpdateRnaData,
  onSetLabelModalOpen,
  onDeleteSelected,
  onClearSelection,
  onFeatureNucleotideToggle,
  onFeatureLabelClick,
  onOpenFeatureModal
}, ref) => {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showNucleotideInfo, setShowNucleotideInfo] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null);
  const [labelDragStart, setLabelDragStart] = useState<{x: number, y: number} | null>(null);
  const [pendingLabelPosition, setPendingLabelPosition] = useState<{x: number, y: number} | null>(null);
  const labelUpdateRef = React.useRef<number | null>(null);
  const [draggingFeature, setDraggingFeature] = useState<string | null>(null);
  const [featureDragStart, setFeatureDragStart] = useState<{x: number, y: number} | null>(null);

  const handleLabelModalClose = () => {
    setShowLabelModal(false);
    setPendingLabelPosition(null);
    onSetLabelModalOpen(false);
  };

  // Handle ESC key to close label modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (showLabelModal || isLabelModalOpen)) {
        handleLabelModalClose();
      }
    };
    
    if (showLabelModal || isLabelModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLabelModal, isLabelModalOpen]);

  const LabelForm = ({ initialText, initialFontSize, onSubmit, onCancel }: {
    initialText: string;
    initialFontSize: number;
    onSubmit: (text: string, fontSize: number) => void;
    onCancel: () => void;
  }) => {
    const [text, setText] = useState(initialText);
    const [fontSize, setFontSize] = useState(initialFontSize);

    const handleSubmit = () => {
      if (text.trim()) {
        onSubmit(text.trim(), fontSize);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Label Text</label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Stop propagation for all keys when editing labels to prevent conflicts
              e.stopPropagation();
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="Enter label text..."
            className="w-full h-10 rounded-md border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 px-3 text-sm"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="8"
              max="50"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-12 text-center bg-slate-100 rounded py-1">
              <span className="text-xs font-medium text-slate-600">{fontSize}px</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3">
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1 h-9 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium"
          >
            {currentLabel ? 'Update' : 'Add'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-9 rounded-md border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const handleIdUpdate = (newId: number) => {
    if (currentNucleotide) {
      const success = onUpdateNucleotideId(currentNucleotide, newId);
      if (!success) {
        alert('ID already exists!');
      }
    }
  };

  const handleLabelClickInternal = (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    onLabelClick(e, labelId);
  };

  const handleLabelMouseDown = (e: React.MouseEvent, labelId: string) => {
    if (mode === 'select') {
      e.stopPropagation();
      onLabelClick(e, labelId);
      setDraggingLabel(labelId);
      setLabelDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleLabelMouseMove = (e: React.MouseEvent) => {
    if (draggingLabel && labelDragStart) {
      e.preventDefault();
      // Calculate delta in screen coordinates
      const screenDeltaX = e.clientX - labelDragStart.x;
      const screenDeltaY = e.clientY - labelDragStart.y;
      
      // Use the same simple approach as nucleotides
      const logicalDeltaX = screenDeltaX / zoomLevel;
      const logicalDeltaY = screenDeltaY / zoomLevel;
      
      // Update immediately without throttling
      onUpdateRnaData({
        ...rnaData,
        annotations: rnaData.annotations?.map(a => 
          a.id === draggingLabel 
            ? { ...a, x: a.x + logicalDeltaX, y: a.y + logicalDeltaY }
            : a
        ) || []
      });
      
      setLabelDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleLabelMouseUp = () => {
    setDraggingLabel(null);
    setLabelDragStart(null);
    if (labelUpdateRef.current) {
      cancelAnimationFrame(labelUpdateRef.current);
      labelUpdateRef.current = null;
    }
  };

  const handleFeatureLabelMouseDown = (e: React.MouseEvent, featureId: string) => {
    if (mode === 'select') {
      e.stopPropagation();
      setDraggingFeature(featureId);
      setFeatureDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleFeatureLabelMouseMove = (e: React.MouseEvent) => {
    if (draggingFeature && featureDragStart) {
      e.preventDefault();
      const screenDeltaX = e.clientX - featureDragStart.x;
      const screenDeltaY = e.clientY - featureDragStart.y;

      const logicalDeltaX = screenDeltaX / zoomLevel;
      const logicalDeltaY = screenDeltaY / zoomLevel;

      const feature = rnaData.structuralFeatures?.find(f => f.id === draggingFeature);
      if (feature) {
        const updatedFeature = {
          ...feature,
          label: {
            ...feature.label,
            x: feature.label.x + logicalDeltaX,
            y: feature.label.y + logicalDeltaY
          }
        };

        onUpdateRnaData({
          ...rnaData,
          structuralFeatures: rnaData.structuralFeatures?.map(f =>
            f.id === draggingFeature ? updatedFeature : f
          )
        });
      }

      setFeatureDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleFeatureLabelMouseUp = () => {
    setDraggingFeature(null);
    setFeatureDragStart(null);
  };

  const handleAddLabel = (text: string, fontSize: number) => {
    if (pendingLabelPosition) {
      const newAnnotation = {
        id: `label-${Date.now()}`,
        text,
        x: pendingLabelPosition.x,
        y: pendingLabelPosition.y,
        fontSize,
        color: '#374151'
      };
      onUpdateRnaData({
        ...rnaData,
        annotations: [...(rnaData.annotations || []), newAnnotation]
      });
      setPendingLabelPosition(null);
    }
  };

  const handleEditLabel = (text: string, fontSize: number) => {
    if (currentLabel) {
      onUpdateRnaData({
        ...rnaData,
        annotations: rnaData.annotations?.map(a => 
          a.id === currentLabel ? { ...a, text, fontSize } : a
        ) || []
      });
    }
  };

  const handleLabelModalSubmit = (text: string, fontSize: number) => {
    if (currentLabel) {
      handleEditLabel(text, fontSize);
    } else {
      handleAddLabel(text, fontSize);
      // Switch to select mode after creating label (same as nucleotides)
      onModeChange('select');
    }
    handleLabelModalClose();
  };

  const getCurrentLabel = () => {
    if (currentLabel) {
      return rnaData.annotations?.find(a => a.id === currentLabel);
    }
    return null;
  };

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

  const handleNucleotideClickInternal = (e: React.MouseEvent, nucleotideId: number) => {
    if (mode === 'feature') {
      e.stopPropagation();
      onFeatureNucleotideToggle(nucleotideId);
    } else {
      onNucleotideClick(e, nucleotideId);
    }
  };

  const renderNucleotides = () => {
    return rnaData.nucleotides.map((nucleotide) => {
      const isSelected = selectedNucleotides.includes(nucleotide.id);
      const isCurrent = currentNucleotide === nucleotide.id;
      const isFeatureSelected = selectedFeatureNucleotides.includes(nucleotide.id);
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
            stroke={isCurrent ? "#0d9488" : isFeatureSelected ? "#8b5cf6" : isSelected ? "#0891b2" : "#374151"}
            strokeWidth={isCurrent ? "4" : isFeatureSelected ? "3" : isSelected ? "3" : "2"}
            className="cursor-pointer"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={(e) => mode !== 'feature' && onNucleotideMouseDown(e, nucleotide.id)}
            onClick={(e) => handleNucleotideClickInternal(e, nucleotide.id)}
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
    <div 
      className="relative h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      {/* Floating Tool Panel - Vertical */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 p-3">
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('select')}
            className={`h-9 w-9 p-0 rounded-lg ${mode === 'select' ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <  MousePointer2  className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('pan')}
            className={`h-9 w-9 p-0 rounded-lg ${mode === 'pan' ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('add')}
            className={`h-9 w-9 p-0 rounded-lg ${mode === 'add' ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('pair')}
            className={`h-9 w-9 p-0 rounded-lg ${mode === 'pair' ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('label')}
            className={`h-9 w-9 p-0 rounded-lg ${mode === 'label' ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('feature')}
            title="Annotate Structural Features (F)"
            className={`h-9 w-9 p-0 rounded-lg ${mode === 'feature' ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Shapes className="h-4 w-4" />
          </Button>
        </div>

      </div>

      {/* Floating Zoom Controls - Minimalist */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 p-3">
        <div className="flex items-center gap-1">
          <Button 
            onClick={() => onZoom(0.25)} 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => onZoom(-0.25)} 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            onClick={onResetView} 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <div className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>

      {/* Floating Info Panel - Minimalist */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="h-9 px-3 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          {currentNucleotide && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNucleotideInfo(!showNucleotideInfo)}
                className="h-9 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium"
              >
                <Target className="h-4 w-4 mr-2" />
                Edit #{currentNucleotide}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentNucleotide) {
                    onDeleteSelected();
                  }
                }}
                className="h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          {currentLabel && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLabelModal(true);
                  onSetLabelModalOpen(true);
                }}
                className="h-9 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium"
              >
                <Type className="h-4 w-4 mr-2" />
                Edit Label
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentLabel) {
                    onUpdateRnaData({
                      ...rnaData,
                      annotations: rnaData.annotations?.filter(a => a.id !== currentLabel) || []
                    });
                    onClearSelection();
                  }
                }}
                className="h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Label
              </Button>
            </>
          )}
          {mode === 'feature' && selectedFeatureNucleotides.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFeatureModal}
              className="h-9 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium"
            >
              <Shapes className="h-4 w-4 mr-2" />
              Create Feature ({selectedFeatureNucleotides.length})
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay */}
      {showKeyboardShortcuts && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-20 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-3xl p-8 max-w-md w-full mx-4 border border-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 tracking-wide">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                <span>Edit label</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Select & Edit</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Clear selection</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nucleotide Info Overlay */}
      {showNucleotideInfo && currentNucleotide && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-20 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-3xl p-8 max-w-md w-full mx-4 border border-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 tracking-wide">Edit Nucleotide</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNucleotideInfo(false)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-700 tracking-wide">ID:</label>
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
                    className="w-20 h-9 rounded-xl border-2 border-slate-200 focus:border-teal-500"
                    autoFocus
                  />
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200 px-3 py-1 rounded-xl font-mono text-sm"
                    onClick={() => onSetEditingId(currentNucleotide)}
                  >
                    #{currentNucleotide}
                  </Badge>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 tracking-wide">Base:</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['A', 'U', 'G', 'C'] as const).map(base => {
                    const nucleotide = rnaData.nucleotides.find(n => n.id === currentNucleotide);
                    const isSelected = nucleotide?.base === base;
                    return (
                      <Button
                        key={base}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onUpdateNucleotideBase(currentNucleotide, base)}
                        className={`h-11 rounded-xl font-bold ${isSelected ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg' : 'hover:bg-slate-50 hover:border-slate-300'}`}
                      >
                        {base}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div 
        ref={ref}
        className="absolute inset-0"
        style={{ 
          cursor: isPanning ? 'grabbing' : (mode === 'select' ? 'default' : mode === 'pan' ? 'grab' : mode === 'label' ? 'text' : 'crosshair')
        }}
        onClick={(e) => {
          if (mode === 'label') {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
            const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
            setPendingLabelPosition({ x, y });
            setShowLabelModal(true);
            onSetLabelModalOpen(true);
          } else {
            onCanvasClick(e);
          }
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={(e) => {
          onMouseMove(e);
          handleLabelMouseMove(e);
          handleFeatureLabelMouseMove(e);
        }}
        onMouseUp={() => {
          onMouseUp();
          handleLabelMouseUp();
          handleFeatureLabelMouseUp();
        }}
        onMouseLeave={() => {
          onMouseUp();
          handleLabelMouseUp();
          handleFeatureLabelMouseUp();
        }}
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
          viewBox={(() => {
            if (rnaData.nucleotides.length === 0) return '0 0 4000 4000';
            const minX = Math.min(...rnaData.nucleotides.map(n => n.x));
            const maxX = Math.max(...rnaData.nucleotides.map(n => n.x));
            const minY = Math.min(...rnaData.nucleotides.map(n => n.y));
            const maxY = Math.max(...rnaData.nucleotides.map(n => n.y));
            const padding = 100;
            return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
          })()}
          className="absolute inset-0 pointer-events-none"
          style={{
            pointerEvents: 'none',
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center'
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

          {/* Structural Features Layer */}
          {mode !== 'add' && rnaData.structuralFeatures?.map(feature => {
            const nucleotides = feature.nucleotideIds
              .map(id => rnaData.nucleotides.find(n => n.id === id))
              .filter(Boolean) as typeof rnaData.nucleotides;

            if (nucleotides.length === 0) return null;

            // Calculate bounding box (accounting for nucleotide center offset of +15)
            const xs = nucleotides.map(n => n.x + 15);
            const ys = nucleotides.map(n => n.y + 15);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            return (
              <g key={feature.id} className="structural-feature">
                {/* Highlight individual nucleotides */}
                {nucleotides.map(nuc => (
                  <circle
                    key={`feature-${feature.id}-nuc-${nuc.id}`}
                    cx={nuc.x + 15}
                    cy={nuc.y + 15}
                    r={19}
                    fill={feature.color || '#8b5cf6'}
                    opacity={0.25}
                    className="pointer-events-none"
                  />
                ))}

                {/* Feature label with clickable background */}
                <g style={{ pointerEvents: 'auto' }}>
                  <rect
                    x={feature.label.x - (feature.label.text.length * feature.label.fontSize) / 3}
                    y={feature.label.y - feature.label.fontSize / 1.5}
                    width={(feature.label.text.length * feature.label.fontSize) / 1.5}
                    height={feature.label.fontSize + 8}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke={feature.label.color || '#6d28d9'}
                    strokeWidth="2"
                    rx="4"
                    className="cursor-move hover:fill-purple-50"
                    onClick={(e) => onFeatureLabelClick(e, feature.id)}
                    onMouseDown={(e) => handleFeatureLabelMouseDown(e, feature.id)}
                  />
                  <text
                    x={feature.label.x}
                    y={feature.label.y}
                    fontSize={feature.label.fontSize}
                    fill={feature.label.color || '#6d28d9'}
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="cursor-move select-none"
                    onClick={(e) => onFeatureLabelClick(e, feature.id)}
                    onMouseDown={(e) => handleFeatureLabelMouseDown(e, feature.id)}
                  >
                    {feature.label.text}
                  </text>
                </g>

                {/* Connector line from label to feature center */}
                <line
                  x1={feature.label.x}
                  y1={feature.label.y + feature.label.fontSize / 2}
                  x2={centerX}
                  y2={centerY}
                  stroke={feature.label.color || '#6d28d9'}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Show selected nucleotides for feature in progress */}
          {mode === 'feature' && selectedFeatureNucleotides.map(id => {
            const nucleotide = rnaData.nucleotides.find(n => n.id === id);
            if (!nucleotide) return null;

            const NUCLEOTIDE_RADIUS = 15;
            return (
              <circle
                key={`feature-selection-${id}`}
                cx={nucleotide.x + 15}
                cy={nucleotide.y + 15}
                r={NUCLEOTIDE_RADIUS + 4}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                className="pointer-events-none"
              />
            );
          })}

          {/* Annotations Layer */}
          <g className="annotations-layer" style={{ pointerEvents: 'auto' }}>
            {rnaData.annotations?.map(annotation => (
              <g key={annotation.id}>
                <rect
                  x={annotation.x - annotation.text.length * annotation.fontSize / 3}
                  y={annotation.y - annotation.fontSize / 1.5}
                  width={annotation.text.length * annotation.fontSize / 1.5}
                  height={annotation.fontSize + 8}
                  fill={currentLabel === annotation.id ? 'rgba(20, 184, 166, 0.1)' : 'transparent'}
                  stroke={currentLabel === annotation.id ? '#14b8a6' : 'transparent'}
                  strokeWidth="2"
                  strokeDasharray={currentLabel === annotation.id ? '3,3' : 'none'}
                  className={`cursor-pointer ${mode === 'select' ? 'hover:fill-teal-50 hover:stroke-teal-300' : ''}`}
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => handleLabelClickInternal(e, annotation.id)}
                  onMouseDown={(e) => handleLabelMouseDown(e, annotation.id)}
                />
                <text
                  x={annotation.x}
                  y={annotation.y}
                  fontSize={annotation.fontSize}
                  fill={annotation.color || '#374151'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="cursor-pointer select-none font-medium"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => handleLabelClickInternal(e, annotation.id)}
                  onMouseDown={(e) => handleLabelMouseDown(e, annotation.id)}
                >
                  {annotation.text}
                </text>
                {currentLabel === annotation.id && (
                  <g className="pointer-events-none">
                    <circle
                      cx={annotation.x - annotation.text.length * annotation.fontSize / 4 - 8}
                      cy={annotation.y - annotation.fontSize / 2 - 8}
                      r="3"
                      fill="#9ca3af"
                    />
                    <circle
                      cx={annotation.x + annotation.text.length * annotation.fontSize / 4 + 8}
                      cy={annotation.y - annotation.fontSize / 2 - 8}
                      r="3"
                      fill="#9ca3af"
                    />
                    <circle
                      cx={annotation.x - annotation.text.length * annotation.fontSize / 4 - 8}
                      cy={annotation.y + annotation.fontSize / 2 + 8}
                      r="3"
                      fill="#9ca3af"
                    />
                    <circle
                      cx={annotation.x + annotation.text.length * annotation.fontSize / 4 + 8}
                      cy={annotation.y + annotation.fontSize / 2 + 8}
                      r="3"
                      fill="#9ca3af"
                    />
                  </g>
                )}
              </g>
            ))}
          </g>
        </svg>
        
        {/* Empty State */}
        {rnaData.nucleotides.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-gradient-to-br from-white via-white to-slate-50 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
              <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Start Creating</h3>
              <p className="text-sm text-slate-600 max-w-sm">
                Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">N</kbd> to add your first nucleotide or click the Add tool and click on the canvas
              </p>
            </div>
          </div>
        )}


        {/* Label Modal */}
        {(showLabelModal || isLabelModalOpen) && (
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center"
            onClick={handleLabelModalClose}
          >
            <div 
              className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Type className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {currentLabel ? 'Edit Label' : 'Add Label'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLabelModalClose}
                  className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <LabelForm
                initialText={getCurrentLabel()?.text || ''}
                initialFontSize={getCurrentLabel()?.fontSize || 14}
                onSubmit={handleLabelModalSubmit}
                onCancel={handleLabelModalClose}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

FullscreenCanvas.displayName = 'FullscreenCanvas';

export default FullscreenCanvas;