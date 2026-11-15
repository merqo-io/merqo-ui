// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PressButton } from "./press-button";

describe("PressButton", () => {
  it("defaults to type=button so it never submits a form", () => {
    render(<PressButton>Go</PressButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
  it("allows type to be overridden", () => {
    render(<PressButton type="submit">Go</PressButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
  it("fires on a touch tap", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PressButton onClick={onClick}>Go</PressButton>);
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button"),
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
