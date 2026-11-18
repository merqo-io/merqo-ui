import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AsyncSubmitButton } from "./async-submit-button";
import * as api from "./index";

describe("AsyncSubmitButton", () => {
  it("is part of the public API", () => {
    expect(api.AsyncSubmitButton).toBe(AsyncSubmitButton);
  });
  it("submits its form by touch", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AsyncSubmitButton pending={false}>Save</AsyncSubmitButton>
      </form>,
    );
    const user = userEvent.setup();
    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "Save" }),
    });
    expect(onSubmit).toHaveBeenCalled();
  });
  it("shows the pending label, disables and marks busy", () => {
    render(
      <AsyncSubmitButton pending pendingChildren="Saving…">
        Save
      </AsyncSubmitButton>,
    );
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("AsyncSubmitButton reduced motion", () => {
  it("spins only when motion is allowed and keeps the icon", () => {
    render(<AsyncSubmitButton pending>Save</AsyncSubmitButton>);
    const icon = screen.getByRole("button").querySelector("svg")!;
    const tokens = icon.getAttribute("class")!.split(" ");
    expect(tokens).toContain("motion-safe:animate-spin");
    expect(tokens).not.toContain("animate-spin");
  });
});
