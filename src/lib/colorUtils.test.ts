import { describe, it, expect } from "vitest";
import { getColorForValue } from "./colorUtils";

describe("getColorForValue", () => {
  it("returns red for value at min", () => {
    const result = getColorForValue(0, 0, 1);
    expect(result).toBe("rgb(255, 255, 255)");
  });

  it("returns darker green/blue for value at max", () => {
    const result = getColorForValue(1, 0, 1);
    expect(result).toBe("rgb(255, 0, 0)");
  });

  it("handles custom min/max range", () => {
    const result = getColorForValue(50, 0, 100);
    expect(result).toBe("rgb(255, 127, 127)");
  });

  it("clamps values below min to min", () => {
    const result = getColorForValue(-10, 0, 100);
    expect(result).toBe("rgb(255, 255, 255)");
  });

  it("clamps values above max to max", () => {
    const result = getColorForValue(200, 0, 100);
    expect(result).toBe("rgb(255, 0, 0)");
  });

  it("handles middle values", () => {
    const result = getColorForValue(0.5, 0, 1);
    expect(result).toBe("rgb(255, 127, 127)");
  });
});
