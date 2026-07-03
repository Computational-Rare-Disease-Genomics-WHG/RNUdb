import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDragAndZoom } from "./useDragAndZoom";

function createMockCanvas() {
  const mockGetScreenCTM = vi.fn(() => ({
    inverse: () => new DOMMatrix([1, 0, 0, 1, 0, 0]),
  }));

  const mockSvgDiv = {
    querySelector: vi.fn((sel: string) => {
      if (sel === "svg[viewBox]") {
        return { getScreenCTM: mockGetScreenCTM };
      }
      return null;
    }),
  } as unknown as HTMLDivElement;

  const ref = { current: mockSvgDiv } as React.RefObject<HTMLDivElement | null>;
  return { ref, mockGetScreenCTM };
}

const defaultProps = {
  canvasRef: { current: null } as React.RefObject<HTMLDivElement | null>,
  mode: "select" as const,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  onUpdateNucleotidePosition: vi.fn(),
  findSnapPosition: vi.fn((x: number, y: number) => ({ x, y })),
  nucleotides: [
    { id: 1, x: 100, y: 100 },
    { id: 2, x: 200, y: 100 },
    { id: 3, x: 150, y: 200 },
  ],
  rnaData: {},
  selectedNucleotides: [],
};

describe("useDragAndZoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("multi-drag with selectedNucleotides", () => {
    it("moves all selected nucleotides by the same delta", () => {
      const { ref } = createMockCanvas();
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        useDragAndZoom({
          ...defaultProps,
          canvasRef: ref,
          selectedNucleotides: [1, 2],
          onUpdateNucleotidePosition: onUpdate,
          nucleotides: [
            { id: 1, x: 100, y: 100 },
            { id: 2, x: 200, y: 100 },
          ],
        }),
      );

      act(() => {
        result.current.handleNucleotideMouseDown(
          {
            clientX: 0,
            clientY: 0,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
          } as unknown as React.MouseEvent,
          1,
        );
      });

      act(() => {
        result.current.handleMouseMove({
          clientX: 50,
          clientY: 30,
        } as unknown as React.MouseEvent);
      });

      expect(onUpdate).toHaveBeenCalledWith(1, 150, 130);
      expect(onUpdate).toHaveBeenCalledWith(2, 250, 130);
      expect(onUpdate).toHaveBeenCalledTimes(2);
    });

    it("moves only the clicked nucleotide if it is not in selection", () => {
      const { ref } = createMockCanvas();
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        useDragAndZoom({
          ...defaultProps,
          canvasRef: ref,
          selectedNucleotides: [1, 2],
          onUpdateNucleotidePosition: onUpdate,
          nucleotides: [
            { id: 1, x: 100, y: 100 },
            { id: 2, x: 200, y: 100 },
            { id: 3, x: 150, y: 200 },
          ],
        }),
      );

      act(() => {
        result.current.handleNucleotideMouseDown(
          {
            clientX: 0,
            clientY: 0,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
          } as unknown as React.MouseEvent,
          3,
        );
      });

      act(() => {
        result.current.handleMouseMove({
          clientX: 50,
          clientY: 30,
        } as unknown as React.MouseEvent);
      });

      expect(onUpdate).toHaveBeenCalledWith(3, 200, 230);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("does nothing when not in select mode", () => {
      const { ref } = createMockCanvas();
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        useDragAndZoom({
          ...defaultProps,
          canvasRef: ref,
          mode: "pan",
          selectedNucleotides: [1, 2],
          onUpdateNucleotidePosition: onUpdate,
        }),
      );

      act(() => {
        result.current.handleNucleotideMouseDown(
          {
            clientX: 0,
            clientY: 0,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
          } as unknown as React.MouseEvent,
          1,
        );
      });

      act(() => {
        result.current.handleMouseMove({
          clientX: 50,
          clientY: 30,
        } as unknown as React.MouseEvent);
      });

      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("pan handling", () => {
    it("returns pan delta on mouse move in pan mode", () => {
      const { result } = renderHook(() =>
        useDragAndZoom({ ...defaultProps, mode: "pan" }),
      );

      act(() => {
        result.current.handleCanvasMouseDown({
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        const res = result.current.handleMouseMove({
          clientX: 150,
          clientY: 120,
        } as React.MouseEvent);
        expect(res).toEqual({
          type: "pan",
          deltaX: 50,
          deltaY: 20,
          newPanPoint: { x: 150, y: 120 },
        });
      });
    });
  });
});
