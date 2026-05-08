import { describe, it, expect } from "vitest";
import type { OverlayData } from "@/types";
import {
  getOverlayValue,
  getOverlayVariantId,
  hasOverlayData,
  convertLegacyOverlay,
} from "./overlayUtils";

describe("getOverlayValue", () => {
  it("returns 0 for undefined nucleotide", () => {
    const data: OverlayData = {};
    expect(getOverlayValue(data, 1)).toBe(0);
  });

  it("returns 0 for null data", () => {
    const data: OverlayData = { 1: null as any };
    expect(getOverlayValue(data, 1)).toBe(0);
  });

  it("returns number for old format", () => {
    const data: OverlayData = { 1: 5 };
    expect(getOverlayValue(data, 1)).toBe(5);
  });

  it("returns value from OverlayPoint for new format", () => {
    const data: OverlayData = { 1: { value: 10 } };
    expect(getOverlayValue(data, 1)).toBe(10);
  });

  it("returns value from OverlayPoint with variantId", () => {
    const data: OverlayData = { 1: { value: 7.5, variantId: "var-123" } };
    expect(getOverlayValue(data, 1)).toBe(7.5);
  });
});

describe("getOverlayVariantId", () => {
  it("returns undefined for old format", () => {
    const data: OverlayData = { 1: 5 };
    expect(getOverlayVariantId(data, 1)).toBeUndefined();
  });

  it("returns undefined for missing data", () => {
    const data: OverlayData = {};
    expect(getOverlayVariantId(data, 1)).toBeUndefined();
  });

  it("returns variantId from OverlayPoint", () => {
    const data: OverlayData = { 1: { value: 5, variantId: "var-123" } };
    expect(getOverlayVariantId(data, 1)).toBe("var-123");
  });

  it("returns undefined when variantId not present in OverlayPoint", () => {
    const data: OverlayData = { 1: { value: 5 } };
    expect(getOverlayVariantId(data, 1)).toBeUndefined();
  });
});

describe("hasOverlayData", () => {
  it("returns false for missing nucleotide", () => {
    const data: OverlayData = {};
    expect(hasOverlayData(data, 1)).toBe(false);
  });

  it("returns true for existing nucleotide", () => {
    const data: OverlayData = { 1: 5 };
    expect(hasOverlayData(data, 1)).toBe(true);
  });

  it("returns true for OverlayPoint format", () => {
    const data: OverlayData = { 1: { value: 5 } };
    expect(hasOverlayData(data, 1)).toBe(true);
  });
});

describe("convertLegacyOverlay", () => {
  it("converts simple number format to OverlayPoint", () => {
    const legacy = { 1: 5, 2: 10, 3: 15 };
    const result = convertLegacyOverlay(legacy);

    expect(result[1]).toEqual({ value: 5 });
    expect(result[2]).toEqual({ value: 10 });
    expect(result[3]).toEqual({ value: 15 });
  });

  it("handles empty object", () => {
    const legacy = {};
    const result = convertLegacyOverlay(legacy);
    expect(Object.keys(result).length).toBe(0);
  });

  it("handles string keys", () => {
    const legacy: { [key: number]: number } = { 1: 5 };
    const result = convertLegacyOverlay(legacy);
    expect(result[1]).toEqual({ value: 5 });
  });
});
