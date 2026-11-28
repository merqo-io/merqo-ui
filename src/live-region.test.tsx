// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveRegion } from "./live-region";

describe("LiveRegion", () => {
  it("renders an sr-only polite atomic status region", () => {
    render(<LiveRegion message="Saved" />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Saved");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region).toHaveClass("sr-only");
  });

  it("uses an alert role when assertive", () => {
    render(<LiveRegion message="Failed" politeness="assertive" />);
    const region = screen.getByRole("alert");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("stays mounted and empty with no message", () => {
    const { rerender } = render(<LiveRegion message="" />);
    const region = screen.getByRole("status");
    expect(region).toBeEmptyDOMElement();
    rerender(<LiveRegion message="Later" />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Later");
  });

  it("remounts the region when announceKey changes so an identical message re-announces", () => {
    const { rerender } = render(<LiveRegion message="Copied" announceKey={1} />);
    const first = screen.getByRole("status");
    rerender(<LiveRegion message="Copied" announceKey={1} />);
    expect(screen.getByRole("status")).toBe(first);
    rerender(<LiveRegion message="Copied" announceKey={2} />);
    expect(screen.getByRole("status")).not.toBe(first);
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });
});
