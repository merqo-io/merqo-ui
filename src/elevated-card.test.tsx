import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ElevatedCard } from "./elevated-card";
import { SURFACE } from "./recipes";

describe("ElevatedCard", () => {
  it("renders children inside a div by default", () => {
    render(<ElevatedCard>content</ElevatedCard>);
    const el = screen.getByText("content");
    expect(el.tagName).toBe("DIV");
  });

  it("renders as the given element", () => {
    render(<ElevatedCard as="section">content</ElevatedCard>);
    expect(screen.getByText("content").tagName).toBe("SECTION");
  });

  it("merges a caller className with the base shadow/border classes", () => {
    render(<ElevatedCard className="px-7 py-6">content</ElevatedCard>);
    const el = screen.getByText("content");
    expect(el.className).toContain("px-7 py-6");
    expect(el.className).toContain("rounded-2xl");
  });
});

describe("ElevatedCard shape", () => {
  it("uses the standalone surface recipe", () => {
    render(<ElevatedCard>content</ElevatedCard>);
    expect(screen.getByText("content")).toHaveClass(...SURFACE.split(" "));
  });

  it("uses standard radius and shadow utilities, no arbitrary values", () => {
    render(<ElevatedCard>content</ElevatedCard>);
    const el = screen.getByText("content");
    expect(el).toHaveClass("rounded-2xl", "shadow-sm");
    expect(el).not.toHaveClass("shadow-md");
    expect(el.className).not.toMatch(/(rounded|shadow)-\[|rgba?\(|oklch/);
  });
});
