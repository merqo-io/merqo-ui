import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutMerqo } from "./about-merqo";

describe("AboutMerqo", () => {
  it("renders the origin story", () => {
    render(<AboutMerqo />);
    expect(screen.getByText("Why Merqo")).toBeInTheDocument();
    expect(
      screen.getByText(/wedding, in the queue for a coffee cart/),
    ).toBeInTheDocument();
  });

  it("describes qkit as piloting and the rest as in build, never live", () => {
    const { container } = render(<AboutMerqo />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/piloting, running with a few vendors/);
    expect(text).toMatch(/in build, built but not yet tried with vendors/);
    expect(text).toMatch(/loopkit/);
    expect(text).toMatch(/paykit/);
    expect(text).toMatch(/stockkit/);
    for (const word of ["live", "available today", "proven"]) {
      expect(text.toLowerCase()).not.toContain(word);
    }
  });

  it("does not name the reader's kit when kitName is omitted", () => {
    render(<AboutMerqo />);
    expect(screen.queryByText(/one kit in that/)).not.toBeInTheDocument();
  });

  it("names the reader's kit when kitName is given", () => {
    render(<AboutMerqo kitName="qkit" />);
    expect(screen.getByText(/reading this on qkit/)).toBeInTheDocument();
  });

  it("renders children (a caller-supplied CTA) inside its own container", () => {
    render(
      <AboutMerqo>
        <button>See the kits</button>
      </AboutMerqo>,
    );
    expect(screen.getByRole("button", { name: "See the kits" })).toBeInTheDocument();
  });
});
