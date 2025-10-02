import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { RNAData } from '../types/rna';
import { useNucleotideManager } from '../hooks/useNucleotideManager';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDragAndZoom } from '../hooks/useDragAndZoom';
import { useImportExport } from '../hooks/useImportExport';
import {
  EditorHeader,
  FullscreenCanvas
} from '../components/Editor';
import { StructuralFeatureModal } from '../components/Editor/StructuralFeatureModal';

const Editor: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const initialRnaData: RNAData = {
    id: "custom-rna-1",
    geneId: "custom-gene",
    name: "Custom RNA",
    nucleotides: [],
    basePairs: [],
    canvasWidth: 2000,
    canvasHeight: 2000,
    annotations: []
  };

  const [mode, setMode] = useState<'select' | 'add' | 'pair' | 'delete' | 'label' | 'pan' | 'feature'>('select');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFeatureNucleotides, setSelectedFeatureNucleotides] = useState<number[]>([]);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);

  const nucleotideManager = useNucleotideManager(initialRnaData);
  const importExport = useImportExport();
  
  const {
    rnaData,
    selectedNucleotides,
    currentNucleotide,
    setSelectedNucleotides,
    setCurrentNucleotide,
    updateRnaData,
    findSnapPosition,
    addNucleotide,
    removeNucleotide,
    updateNucleotidePosition,
    updateNucleotideBase,
    updateNucleotideId,
    addBasePair,
    removeBasePair,
    navigateNucleotides,
    addStructuralFeature,
    updateStructuralFeature,
    removeStructuralFeature
  } = nucleotideManager;

  const {
    downloadJSON,
    importFromFile,
    saveToLocalStorage,
    loadFromLocalStorage
  } = importExport;

  // Load autosave on component mount
  useEffect(() => {
    const autosaved = loadFromLocalStorage('rna_editor_autosave');
    if (autosaved) {
      updateRnaData(autosaved);
    }
  }, []); // Only run once on mount

  // Autosave functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (rnaData.nucleotides.length > 0 || rnaData.basePairs.length > 0 || (rnaData.annotations && rnaData.annotations.length > 0)) {
        try {
          saveToLocalStorage(rnaData, 'rna_editor_autosave');
          console.log('Autosaved at:', new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Autosave failed:', error);
        }
      }
    }, 3000); // Autosave every 3 seconds

    return () => clearInterval(autoSaveInterval);
  }, [rnaData]);

  const dragAndZoom = useDragAndZoom({
    canvasRef,
    mode,
    zoomLevel,
    panOffset,
    onUpdateNucleotidePosition: updateNucleotidePosition,
    findSnapPosition,
    nucleotides: rnaData.nucleotides,
    rnaData
  });

  const {
    draggedNucleotide,
    isPanning,
    handleNucleotideMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasMouseDown,
    updateLastPanPoint
  } = dragAndZoom;

  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.1, Math.min(5, prev + delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleModeChange = useCallback((newMode: 'select' | 'add' | 'pair' | 'delete' | 'label' | 'pan' | 'feature') => {
    setMode(newMode);
    setSelectedNucleotides([]);
    if (newMode !== 'feature') {
      setSelectedFeatureNucleotides([]);
    }
  }, [setSelectedNucleotides]);

  const handleNucleotideClick = useCallback((e: React.MouseEvent, nucleotideId: number) => {
    e.stopPropagation();
    
    if (mode === 'delete') {
      removeNucleotide(nucleotideId);
      return;
    }
    
    if (mode === 'pair') {
      if (selectedNucleotides.includes(nucleotideId)) {
        setSelectedNucleotides(prev => prev.filter(id => id !== nucleotideId));
      } else {
        setSelectedNucleotides(prev => {
          const newSelected = [...prev, nucleotideId];
          if (newSelected.length === 2) {
            const [first, second] = newSelected;
            const hasBasePair = rnaData.basePairs.some(bp => 
              (bp.from === first && bp.to === second) ||
              (bp.from === second && bp.to === first)
            );
            
            if (hasBasePair) {
              removeBasePair(first, second);
            } else {
              addBasePair(first, second);
            }
            return [];
          }
          return newSelected;
        });
      }
      return;
    }
    
    // Select mode - set as current nucleotide and clear label selection
    setCurrentNucleotide(nucleotideId);
    setSelectedNucleotides([nucleotideId]);
    setCurrentLabel(null);
  }, [mode, selectedNucleotides, removeNucleotide, addBasePair, removeBasePair, rnaData.basePairs, setSelectedNucleotides, setCurrentNucleotide]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'add') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
      addNucleotide(x, y);
      setMode('select');
    } else if (mode === 'pair') {
      setSelectedNucleotides([]);
    } else {
      setCurrentNucleotide(null);
      setSelectedNucleotides([]);
      setCurrentLabel(null);
    }
  }, [mode, addNucleotide, panOffset, zoomLevel, setSelectedNucleotides, setCurrentNucleotide]);

  const handleMouseMoveWithPan = useCallback((e: React.MouseEvent) => {
    const result = handleMouseMove(e);
    if (result?.type === 'pan') {
      setPanOffset(prev => ({
        x: prev.x + result.deltaX,
        y: prev.y + result.deltaY
      }));
      updateLastPanPoint(result.newPanPoint);
    }
  }, [handleMouseMove, updateLastPanPoint]);

  const handleClearSelection = useCallback(() => {
    setCurrentNucleotide(null);
    setSelectedNucleotides([]);
    setEditingId(null);
    setCurrentLabel(null);
  }, [setCurrentNucleotide, setSelectedNucleotides]);

  // Feature mode handlers
  const handleFeatureNucleotideToggle = useCallback((nucleotideId: number) => {
    setSelectedFeatureNucleotides(prev =>
      prev.includes(nucleotideId)
        ? prev.filter(id => id !== nucleotideId)
        : [...prev, nucleotideId]
    );
  }, []);

  const handleOpenFeatureModal = useCallback(() => {
    if (selectedFeatureNucleotides.length === 0) {
      alert('Please select nucleotides first');
      return;
    }
    setIsFeatureModalOpen(true);
  }, [selectedFeatureNucleotides]);

  const handleFeatureSubmit = useCallback((feature: Omit<import('../types/rna').StructuralFeature, 'id'>) => {
    if (editingFeature) {
      updateStructuralFeature(editingFeature, feature);
    } else {
      addStructuralFeature(feature);
    }
    setIsFeatureModalOpen(false);
    setSelectedFeatureNucleotides([]);
    setEditingFeature(null);
    setMode('select');
  }, [editingFeature, addStructuralFeature, updateStructuralFeature]);

  const handleFeatureLabelClick = useCallback((e: React.MouseEvent, featureId: string) => {
    e.stopPropagation();
    const feature = rnaData.structuralFeatures?.find(f => f.id === featureId);
    if (feature) {
      setEditingFeature(featureId);
      setSelectedFeatureNucleotides(feature.nucleotideIds);
      setIsFeatureModalOpen(true);
    }
  }, [rnaData.structuralFeatures]);

  const handleFeatureCancel = useCallback(() => {
    setIsFeatureModalOpen(false);
    setSelectedFeatureNucleotides([]);
    setEditingFeature(null);
  }, []);

  const handleLabelClick = useCallback((e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    setCurrentLabel(labelId);
    setCurrentNucleotide(null);
    setSelectedNucleotides([]);
  }, [setCurrentNucleotide, setSelectedNucleotides]);

  const handleRemoveLabel = useCallback((labelId: string) => {
    updateRnaData({
      ...rnaData,
      annotations: rnaData.annotations?.filter(a => a.id !== labelId) || []
    });
    setCurrentLabel(null);
  }, [rnaData, updateRnaData]);

  const handleAddNucleotideWithModeSwitch = useCallback((x: number, y: number): number => {
    const newId = addNucleotide(x, y);
    setMode('select');
    return newId;
  }, [addNucleotide]);

  const handleExport = useCallback(() => {
    downloadJSON(rnaData);
  }, [rnaData, downloadJSON]);

  const handleImport = useCallback(async () => {
    const imported = await importFromFile();
    if (imported) {
      updateRnaData(imported);
      alert('Structure imported successfully!');
    } else {
      alert('Failed to import structure');
    }
  }, [importFromFile, updateRnaData]);

  useKeyboardShortcuts({
    canvasRef,
    currentNucleotide,
    currentLabel,
    editingId,
    isLabelModalOpen,
    isFeatureModalOpen,
    panOffset,
    zoomLevel,
    onAddNucleotide: handleAddNucleotideWithModeSwitch,
    onUpdateNucleotideBase: updateNucleotideBase,
    onNavigateNucleotides: navigateNucleotides,
    onRemoveNucleotide: removeNucleotide,
    onRemoveLabel: handleRemoveLabel,
    onClearSelection: handleClearSelection,
    onModeChange: handleModeChange
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      <EditorHeader
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <FullscreenCanvas
        ref={canvasRef}
        rnaData={rnaData}
        mode={mode}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        isPanning={isPanning}
        draggedNucleotide={draggedNucleotide}
        selectedNucleotides={selectedNucleotides}
        currentNucleotide={currentNucleotide}
        currentLabel={currentLabel}
        editingId={editingId}
        isLabelModalOpen={isLabelModalOpen}
        selectedFeatureNucleotides={selectedFeatureNucleotides}
        isFeatureModalOpen={isFeatureModalOpen}
        editingFeature={editingFeature}
        onCanvasClick={handleCanvasClick}
        onCanvasMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMoveWithPan}
        onMouseUp={handleMouseUp}
        onNucleotideClick={handleNucleotideClick}
        onNucleotideMouseDown={handleNucleotideMouseDown}
        onLabelClick={handleLabelClick}
        onZoom={handleZoom}
        onResetView={resetView}
        onModeChange={handleModeChange}
        onUpdateNucleotideBase={updateNucleotideBase}
        onUpdateNucleotideId={updateNucleotideId}
        onSetEditingId={setEditingId}
        onUpdateRnaData={updateRnaData}
        onSetLabelModalOpen={setIsLabelModalOpen}
        onClearSelection={handleClearSelection}
        onDeleteSelected={() => {
          selectedNucleotides.forEach(id => removeNucleotide(id));
          setSelectedNucleotides([]);
        }}
        onFeatureNucleotideToggle={handleFeatureNucleotideToggle}
        onFeatureLabelClick={handleFeatureLabelClick}
        onOpenFeatureModal={handleOpenFeatureModal}
        onSetFeatureModalOpen={setIsFeatureModalOpen}
      />

      {isFeatureModalOpen && (
        <StructuralFeatureModal
          isOpen={isFeatureModalOpen}
          selectedNucleotides={selectedFeatureNucleotides}
          nucleotides={rnaData.nucleotides}
          initialFeature={
            editingFeature
              ? rnaData.structuralFeatures?.find(f => f.id === editingFeature)
              : undefined
          }
          onSubmit={handleFeatureSubmit}
          onCancel={handleFeatureCancel}
        />
      )}
    </div>
  );
};

export default Editor;