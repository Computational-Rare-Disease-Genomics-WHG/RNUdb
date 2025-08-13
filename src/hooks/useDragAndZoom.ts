import { useState, useCallback, useRef, useEffect, type RefObject } from 'react';

interface DragAndZoomProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  mode: 'select' | 'add' | 'pair' | 'delete' | 'pan' | 'label';
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onUpdateNucleotidePosition: (id: number, x: number, y: number) => void;
  findSnapPosition: (x: number, y: number, excludeId?: number) => { x: number; y: number };
  nucleotides: Array<{ id: number; x: number; y: number }>;
  rnaData: { canvasWidth?: number; canvasHeight?: number };
}

export const useDragAndZoom = ({
  canvasRef,
  mode,
  zoomLevel,
  panOffset,
  onUpdateNucleotidePosition,
  findSnapPosition,
  nucleotides,
  rnaData
}: DragAndZoomProps) => {
  const [draggedNucleotide, setDraggedNucleotide] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ id: number; x: number; y: number } | null>(null);

  // Use requestAnimationFrame to batch position updates
  useEffect(() => {
    const updatePosition = () => {
      if (pendingUpdateRef.current) {
        const { id, x, y } = pendingUpdateRef.current;
        onUpdateNucleotidePosition(id, x, y);
        pendingUpdateRef.current = null;
      }
    };

    if (draggedNucleotide) {
      const scheduleUpdate = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updatePosition);
      };

      if (pendingUpdateRef.current) {
        scheduleUpdate();
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draggedNucleotide, onUpdateNucleotidePosition]);

  const handleNucleotideMouseDown = useCallback((e: React.MouseEvent, nucleotideId: number) => {
    if (mode === 'select') {
      e.preventDefault();
      setDraggedNucleotide(nucleotideId);
      
      // Use the same approach as labels - just store the starting mouse position
      setDragOffset({
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [mode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && mode === 'pan') {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      return {
        type: 'pan' as const,
        deltaX,
        deltaY,
        newPanPoint: { x: e.clientX, y: e.clientY }
      };
    } else if (draggedNucleotide && mode === 'select') {
      const nucleotide = nucleotides.find(n => n.id === draggedNucleotide);
      if (nucleotide) {
        // With no transforms, just use the mouse delta directly
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        // Convert screen pixels to SVG units (account for both viewBox and CSS transform)
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          // Simple approach: just use the zoomLevel since we know it works
          const logicalDeltaX = deltaX / zoomLevel;
          const logicalDeltaY = deltaY / zoomLevel;
          
          // Update nucleotide position by adding the delta
          const newX = nucleotide.x + logicalDeltaX;
          const newY = nucleotide.y + logicalDeltaY;
          
          // Remove debug logging
          // console.log('Drag:', { ... });
          
          // Update nucleotide position
          onUpdateNucleotidePosition(draggedNucleotide, newX, newY);
          
          // Update the drag start position
          setDragOffset({
            x: e.clientX,
            y: e.clientY
          });
        }
      }
    }
    
    return null;
  }, [
    isPanning,
    draggedNucleotide,
    lastPanPoint,
    mode,
    canvasRef,
    dragOffset,
    panOffset,
    zoomLevel,
    findSnapPosition,
    onUpdateNucleotidePosition,
    nucleotides,
    rnaData
  ]);

  const handleMouseUp = useCallback(() => {
    setDraggedNucleotide(null);
    setIsPanning(false);
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [mode]);

  const updateLastPanPoint = useCallback((point: { x: number; y: number }) => {
    setLastPanPoint(point);
  }, []);

  return {
    draggedNucleotide,
    dragOffset,
    isPanning,
    lastPanPoint,
    handleNucleotideMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasMouseDown,
    updateLastPanPoint
  };
};