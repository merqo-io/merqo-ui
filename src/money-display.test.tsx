import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Money } from "./money-display";

describe("Money", () => {
  it("formats cents as Singapore dollars", () => {
    render(<Money cents={1250} />);
    expect(screen.getByText("S$12.50")).toBeInTheDocument();
  });

  it("never splits an amount across lines and uses tabular figures", () => {
    render(<Money cents={1250} className="font-medium" />);
    const el = screen.getByText("S$12.50");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("tabular-nums", "whitespace-nowrap", "font-medium");
  });

  it("trims whole dollars when asked", () => {
    render(<Money cents={1200} trimWholeDollars />);
    expect(screen.getByText("S$12")).toBeInTheDocument();
  });

  it("shows a dash for a non-finite amount", () => {
    render(<Money cents={Number.NaN} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
