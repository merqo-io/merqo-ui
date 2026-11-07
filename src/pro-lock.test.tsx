import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProLock } from "./pro-lock";

describe("ProLock", () => {
  it("links to the plan page with the supplied copy", () => {
    render(<ProLock href="/dashboard/plan" label="Upgrade to Pro" />);
    const link = screen.getByRole("link", { name: "Upgrade to Pro" });
    expect(link).toHaveAttribute("href", "/dashboard/plan");
    expect(link).toHaveClass("min-h-11");
  });

  it("fires onClick on touch", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(<ProLock href="/plan" label="Pro" onClick={onClick} />);
    await user.pointer({ keys: "[TouchA]", target: screen.getByRole("link") });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses a supplied link component", () => {
    const Custom = (p: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
      <a data-custom="1" {...p} />
    );
    render(<ProLock href="/plan" label="Pro" LinkComponent={Custom} className="extra" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-custom", "1");
    expect(link).toHaveClass("extra");
  });
});
