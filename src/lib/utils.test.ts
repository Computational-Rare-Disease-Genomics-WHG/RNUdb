import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (className merge)", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const condition = false;
    const result = cn("foo", condition && "bar", "baz");
    expect(result).toBe("foo baz");
  });

  it("handles empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles true condition for class", () => {
    const condition = true;
    const result = cn("foo", condition && "bar");
    expect(result).toBe("foo bar");
  });

  it("handles null and undefined", () => {
    const result = cn("foo", null, undefined, "bar");
    expect(result).toBe("foo bar");
  });

  it("handles numbers", () => {
    const result = cn("foo", 0, "bar");
    expect(result).toBe("foo bar");
  });
});
