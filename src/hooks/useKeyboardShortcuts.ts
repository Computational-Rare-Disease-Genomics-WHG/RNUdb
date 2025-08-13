import { useEffect, type RefObject } from 'react';

interface KeyboardShortcutsProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  currentNucleotide: number | null;
  currentLabel: string | null;
  editingId: number | null;
  isLabelModalOpen: boolean;
  panOffset: { x: number; y: number };
  zoomLevel: number;
  onAddNucleotide: (x: number, y: number) => number;
  onUpdateNucleotideBase: (nucleotideId: number, newBase: 'A' | 'C' | 'G' | 'U') => void;
  onNavigateNucleotides: (direction: string) => void;
  onRemoveNucleotide: (id: number) => void;
  onRemoveLabel: (labelId: string) => void;
  onClearSelection: () => void;
  onModeChange: (mode: 'select' | 'add' | 'pair' | 'delete' | 'label' | 'pan') => void;
}

export const useKeyboardShortcuts = ({
  canvasRef,
  currentNucleotide,
  currentLabel,
  editingId,
  isLabelModalOpen,
  panOffset,
  zoomLevel,
  onAddNucleotide,
  onUpdateNucleotideBase,
  onNavigateNucleotides,
  onRemoveNucleotide,
  onRemoveLabel,
  onClearSelection,
  onModeChange
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when editing ID or when label modal is open
      if (editingId !== null || isLabelModalOpen) return;
      
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          // Create a new nucleotide using smart positioning
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            // Convert to logical coordinates
            const logicalX = (centerX - panOffset.x) / zoomLevel;
            const logicalY = (centerY - panOffset.y) / zoomLevel;
            onAddNucleotide(logicalX, logicalY);
          }
          break;
        case 'a':
        case 'c':
        case 'g':
        case 'u':
          e.preventDefault();
          if (currentNucleotide) {
            onUpdateNucleotideBase(currentNucleotide, e.key.toUpperCase() as 'A' | 'C' | 'G' | 'U');
          }
          break;
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          e.preventDefault();
          onNavigateNucleotides(e.key);
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          if (currentNucleotide) {
            onRemoveNucleotide(currentNucleotide);
          } else if (currentLabel) {
            onRemoveLabel(currentLabel);
          }
          break;
        case 'escape':
          e.preventDefault();
          onClearSelection();
          break;
        case ' ':
          e.preventDefault();
          onModeChange('pan');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when editing ID or when label modal is open
      if (editingId !== null || isLabelModalOpen) return;
      
      if (e.key === ' ') {
        e.preventDefault();
        onModeChange('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    canvasRef,
    currentNucleotide,
    currentLabel,
    editingId,
    isLabelModalOpen,
    panOffset,
    zoomLevel,
    onAddNucleotide,
    onUpdateNucleotideBase,
    onNavigateNucleotides,
    onRemoveNucleotide,
    onRemoveLabel,
    onClearSelection,
    onModeChange
  ]);
};