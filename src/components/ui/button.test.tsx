import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("renders as button by default", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<Button>Test</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("bg-blue-600");
  });

  it("applies variant classes correctly", () => {
    const { container: destructive } = render(
      <Button variant="destructive">Delete</Button>,
    );
    expect(destructive.querySelector("button")?.className).toContain(
      "bg-red-600",
    );

    const { container: outline } = render(
      <Button variant="outline">Outline</Button>,
    );
    expect(outline.querySelector("button")?.className).toContain("border");

    const { container: ghost } = render(<Button variant="ghost">Ghost</Button>);
    expect(ghost.querySelector("button")?.className).toContain(
      "hover:bg-slate-100",
    );

    const { container: secondary } = render(
      <Button variant="secondary">Secondary</Button>,
    );
    expect(secondary.querySelector("button")?.className).toContain(
      "bg-slate-200",
    );

    const { container: link } = render(<Button variant="link">Link</Button>);
    expect(link.querySelector("button")?.className).toContain("text-blue-600");
  });

  it("applies size classes correctly", () => {
    const { container: sm } = render(<Button size="sm">Small</Button>);
    expect(sm.querySelector("button")?.className).toContain("h-8");

    const { container: lg } = render(<Button size="lg">Large</Button>);
    expect(lg.querySelector("button")?.className).toContain("h-10");

    const { container: icon } = render(<Button size="icon">X</Button>);
    expect(icon.querySelector("button")?.className).toContain("size-9");
  });

  it("handles disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button.className).toContain("disabled:opacity-50");
  });

  it("handles loading state", () => {
    render(<Button disabled>Loading...</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button.className).toContain("custom-class");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByRole("button", { name: /click/i }).click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("buttonVariants", () => {
  it("returns default variant classes", () => {
    const classes = buttonVariants({});
    expect(classes).toContain("bg-blue-600");
    expect(classes).toContain("h-9");
  });

  it("returns specified variant", () => {
    const classes = buttonVariants({ variant: "destructive" });
    expect(classes).toContain("bg-red-600");
  });

  it("returns specified size", () => {
    const classes = buttonVariants({ size: "lg" });
    expect(classes).toContain("h-10");
  });

  it("combines variant and size", () => {
    const classes = buttonVariants({ variant: "outline", size: "sm" });
    expect(classes).toContain("border");
    expect(classes).toContain("h-8");
  });
});
