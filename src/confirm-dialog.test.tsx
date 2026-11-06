import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "./confirm-dialog";

function setup(onConfirm: () => Promise<unknown> | unknown, extra = {}) {
  render(
    <ConfirmDialog
      trigger={<button>Delete</button>}
      title="Delete it?"
      description="This cannot be undone."
      confirmLabel="Yes, delete"
      pendingLabel="Deleting..."
      variant="destructive"
      onConfirm={onConfirm}
      {...extra}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("is closed until the trigger is pressed, then shows title and description", async () => {
    const user = userEvent.setup();
    setup(() => undefined);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("alertdialog", { name: "Delete it?" })).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, delete" })).toHaveClass("bg-destructive");
  });

  it("cancel closes without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    setup(onConfirm, { cancelLabel: "Keep it" });
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("stays open and pending while onConfirm runs, then closes on success", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    setup(onConfirm);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    const busy = await screen.findByRole("button", { name: "Deleting..." });
    expect(busy).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows the thrown message inline and stays open, allowing a retry", async () => {
    const user = userEvent.setup();
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error("Server said no"))
      .mockResolvedValueOnce(undefined);
    setup(onConfirm);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server said no");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("falls back to a generic message for a throw without one", async () => {
    const user = userEvent.setup();
    setup(() => Promise.reject("boom"));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not complete that action. Try again.",
    );
  });

  it("treats a Next.js redirect as navigation: no error, stays busy", async () => {
    const user = userEvent.setup();
    setup(() => Promise.reject(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/x;307;" })));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("supports a controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="T"
        description="D"
        confirmLabel="Go"
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
