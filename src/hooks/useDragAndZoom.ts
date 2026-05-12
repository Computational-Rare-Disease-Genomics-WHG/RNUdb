import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type RefObject,
} from "react";

interface DragAndZoomProps {
  canvasRef: RefObject<HTMLDivElement | null>;
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
}: DragAndZoomProps) => {
  const [draggedNucleotide, setDraggedNucleotide] = useState<number | null>(
    null,
  );
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ id: number; x: number; y: number } | null>(
    null,
  );

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

  const handleNucleotideMouseDown = useCallback(
    (e: React.MouseEvent, nucleotideId: number) => {
      if (mode === "select") {
        e.preventDefault();
        setDraggedNucleotide(nucleotideId);
      }
    },
    [mode],
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
        const svg =
          canvasRef.current?.querySelector<SVGSVGElement>("svg[viewBox]");
        if (svg) {
          const pt = new DOMPoint(e.clientX, e.clientY);
          const svgPoint = pt.matrixTransform(
            svg.getScreenCTM()?.inverse() ?? new DOMMatrix(),
          );
          onUpdateNucleotidePosition(draggedNucleotide, svgPoint.x, svgPoint.y);
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
