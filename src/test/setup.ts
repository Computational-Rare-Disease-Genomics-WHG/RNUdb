import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

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
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(""),
    },
  },
});
