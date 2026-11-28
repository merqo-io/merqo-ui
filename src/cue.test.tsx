// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cue } from "./cue";

describe("Cue", () => {
  it("draws a decorative ring when active", () => {
    const { container } = render(
      <Cue active>
        <button>Go</button>
      </Cue>,
    );
    const ring = container.querySelector("[data-cue]");
    expect(ring).toHaveAttribute("aria-hidden", "true");
    expect(ring).toHaveClass("ring-primary");
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("draws nothing when inactive", () => {
    const { container } = render(
      <Cue active={false}>
        <button>Go</button>
      </Cue>,
    );
    expect(container.querySelector("[data-cue]")).toBeNull();
  });

  it("uses the foreground ring for the foreground tone", () => {
    const { container } = render(
      <Cue active tone="foreground" className="extra">
        <button>Go</button>
      </Cue>,
    );
    expect(container.querySelector("[data-cue]")).toHaveClass("ring-foreground");
    expect(container.firstElementChild).toHaveClass("extra");
  });
});
