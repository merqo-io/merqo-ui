import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("ConfirmDialog stakes", () => {
  const touch = (user: ReturnType<typeof userEvent.setup>, target: Element) =>
    user.pointer({ keys: "[TouchA]", target });

  async function open(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Delete" }));
  }

  it("announces the consequence with the description", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { consequence: "All 42 orders are lost." });
    await open(user);
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAccessibleDescription(
      "This cannot be undone. All 42 orders are lost.",
    );
    expect(screen.getByText("All 42 orders are lost.")).toHaveClass("text-foreground");
  });

  it("gates confirm on the phrase, ignoring case and whitespace", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    setup(onConfirm, { confirmPhrase: "Corner Stall" });
    await open(user);
    const confirm = screen.getByRole("button", { name: "Yes, delete" });
    const input = screen.getByLabelText("Type Corner Stall to confirm");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("autocapitalize", "off");
    expect(confirm).toBeDisabled();
    await user.type(input, "corner");
    expect(confirm).toBeDisabled();
    await user.type(input, " stall ");
    expect(confirm).toBeEnabled();
    await touch(user, confirm);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("clears the phrase when the dialog reopens", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { confirmPhrase: "go" });
    await open(user);
    await user.type(screen.getByLabelText(/Type/), "go");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await open(user);
    expect(screen.getByLabelText(/Type/)).toHaveValue("");
  });

  it("Enter confirms only when the phrase matches", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    setup(onConfirm, { confirmPhrase: "go" });
    await open(user);
    const input = screen.getByLabelText(/Type/);
    await user.type(input, "n{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, "GO{Enter}");
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("defaults to the destructive variant when a phrase is set", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { confirmPhrase: "go", variant: undefined });
    await open(user);
    expect(screen.getByRole("button", { name: "Yes, delete" })).toHaveClass("bg-destructive");
  });

  it("keeps the default variant without a phrase", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { variant: undefined });
    await open(user);
    expect(screen.getByRole("button", { name: "Yes, delete" })).not.toHaveClass("bg-destructive");
  });

  it("focuses Cancel on open, with and without a phrase", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Delete it?"
        description="Sure?"
        confirmLabel="Delete booth"
        onConfirm={() => undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    unmount();
    setup(() => undefined, { confirmPhrase: "go" });
    await open(user);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(screen.getByLabelText(/Type/)).not.toHaveFocus();
  });

  it("links the visible instruction to the input and keeps a specific confirm label", async () => {
    const user = userEvent.setup();
    setup(() => undefined, {
      confirmPhrase: "Corner Stall",
      confirmLabel: "Delete booth",
      consequence: "All 42 orders are lost and cannot be recovered.",
    });
    await open(user);
    screen.getByLabelText("Type Corner Stall to confirm");
    expect(screen.getByRole("button", { name: "Delete booth" })).toBeDisabled();
    expect(screen.getByText(/cannot be recovered/)).toBeInTheDocument();
  });

  it("does not repeat the instruction as a description of the input", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { confirmPhrase: "go" });
    await open(user);
    expect(screen.getByLabelText("Type go to confirm")).not.toHaveAttribute("aria-describedby");
  });

  it("wraps the description in a div so block content is valid", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { description: <ul><li>One</li></ul>, consequence: "Lost." });
    await open(user);
    expect(screen.getByText("One").closest("p")).toBeNull();
  });

  it("ignores Enter during IME composition", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    setup(onConfirm, { confirmPhrase: "go" });
    await open(user);
    const input = screen.getByLabelText(/Type/);
    await user.type(input, "go");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("treats a blank phrase as no phrase", async () => {
    const user = userEvent.setup();
    setup(() => undefined, { confirmPhrase: "  ", variant: undefined });
    await open(user);
    expect(screen.queryByLabelText(/Type/)).not.toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Yes, delete" });
    expect(confirm).toBeEnabled();
    expect(confirm).not.toHaveClass("bg-destructive");
  });
});

describe("ConfirmDialog error Alert", () => {
  it("shows the failure in an Alert inside the dialog", async () => {
    const user = userEvent.setup();
    setup(vi.fn().mockRejectedValue(new Error("Server said no")));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(screen.getByRole("alertdialog")).toContainElement(alert);
  });
});