import "@testing-library/jest-dom";
import { vi } from "vitest";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });
Object.defineProperty(global, "navigator", {
  value: {
    userAgent: "vitest",
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(""),
    },
  },
  writable: true,
});

class MockDOMPoint {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  matrixTransform(_transform: DOMMatrix) {
    return this;
  }
}

Object.defineProperty(global, "DOMPoint", {
  value: MockDOMPoint,
  writable: true,
});

Object.defineProperty(global, "DOMMatrix", {
  value: class MockDOMMatrix {
    constructor(_init?: string | number[]) {}
  },
  writable: true,
});
