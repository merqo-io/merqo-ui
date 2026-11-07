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
