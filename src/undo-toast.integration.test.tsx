import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toaster } from "./providers";
import { undoToast } from "./undo-toast";

describe("undoToast with the real Toaster", () => {
  it("announces the message, exposes a named Undo button and undoes by touch", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => {
      undoToast({ message: "Photo removed", onUndo });
    });

    const message = await screen.findByText("Photo removed");
    const region = document.querySelector('section[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region?.contains(message)).toBe(true);

    const button = screen.getByRole("button", { name: "Undo" });
    expect(button.className).toContain("pointer-coarse:after:size-11");
    expect(button.className).toContain("relative");

    await user.pointer({ keys: "[TouchA]", target: button });
    expect(onUndo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText("Photo removed")).toBeNull());
  });

  it("names the action with a custom undoLabel", async () => {
    render(<Toaster />);
    act(() => {
      undoToast({ message: "Row deleted", onUndo: vi.fn(), undoLabel: "Restore" });
    });
    expect(await screen.findByRole("button", { name: "Restore" })).toBeTruthy();
  });
});
