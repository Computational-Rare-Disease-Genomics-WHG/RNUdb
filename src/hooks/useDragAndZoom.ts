import { useState, useCallback, useRef } from "react";

interface DragAndZoomProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  mode: "select" | "add" | "pair" | "delete" | "pan" | "label" | "feature";
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onUpdateNucleotidePosition: (id: number, x: number, y: number) => void;
  findSnapPosition: (
    x: number,
    y: number,
    excludeId?: number,
  ) => { x: number; y: number };
  nucleotides: Array<{ id: number; x: number; y: number }>;
  rnaData: { canvasWidth?: number; canvasHeight?: number };
  selectedNucleotides: number[];
}

export const useDragAndZoom = ({
  canvasRef,
  mode,
  zoomLevel: _zoomLevel,
  panOffset: _panOffset,
  onUpdateNucleotidePosition,
  findSnapPosition: _findSnapPosition,
  nucleotides: _nucleotides,
  rnaData: _rnaData,
  selectedNucleotides,
}: DragAndZoomProps) => {
  const [draggedNucleotide, setDraggedNucleotide] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const dragInitialSvgPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPositionsRef = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );

  const handleNucleotideMouseDown = useCallback(
    (e: React.MouseEvent, nucleotideId: number) => {
      if (mode === "select") {
        e.preventDefault();
        e.stopPropagation();

        const idsToDrag =
          selectedNucleotides.includes(nucleotideId) && selectedNucleotides.length > 1
            ? selectedNucleotides
            : [nucleotideId];

        setDraggedNucleotide(nucleotideId);

        const svg = canvasRef.current?.querySelector<SVGSVGElement>("svg[viewBox]");
        if (svg) {
          const pt = new DOMPoint(e.clientX, e.clientY);
          const svgPoint = pt.matrixTransform(
            svg.getScreenCTM()?.inverse() ?? new DOMMatrix(),
          );
          dragInitialSvgPointRef.current = svgPoint;

          const positions = new Map<number, { x: number; y: number }>();
          for (const id of idsToDrag) {
            const nuc = _nucleotides.find((n) => n.id === id);
            if (nuc) positions.set(id, { x: nuc.x, y: nuc.y });
          }
          dragStartPositionsRef.current = positions;
        }
      }
    },
    [mode, selectedNucleotides, canvasRef, _nucleotides],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && mode === "pan") {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        return {
          type: "pan" as const,
          deltaX,
          deltaY,
          newPanPoint: { x: e.clientX, y: e.clientY },
        };
      } else if (draggedNucleotide && mode === "select") {
        const svg = canvasRef.current?.querySelector<SVGSVGElement>("svg[viewBox]");
        if (svg && dragInitialSvgPointRef.current) {
          const pt = new DOMPoint(e.clientX, e.clientY);
          const currentSvgPoint = pt.matrixTransform(
            svg.getScreenCTM()?.inverse() ?? new DOMMatrix(),
          );

          const dx = currentSvgPoint.x - dragInitialSvgPointRef.current.x;
          const dy = currentSvgPoint.y - dragInitialSvgPointRef.current.y;

          dragStartPositionsRef.current.forEach((startPos, id) => {
            onUpdateNucleotidePosition(id, startPos.x + dx, startPos.y + dy);
          });
        }
      }

      return null;
    },
    [
      isPanning,
      draggedNucleotide,
      lastPanPoint,
      mode,
      canvasRef,
      onUpdateNucleotidePosition,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setDraggedNucleotide(null);
    setIsPanning(false);
    dragInitialSvgPointRef.current = null;
    dragStartPositionsRef.current = new Map();
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === "pan") {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [mode],
  );

  const updateLastPanPoint = useCallback((point: { x: number; y: number }) => {
    setLastPanPoint(point);
  }, []);

  return {
    draggedNucleotide,
    isPanning,
    lastPanPoint,
    handleNucleotideMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasMouseDown,
    updateLastPanPoint,
  };
};
