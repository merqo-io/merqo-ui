import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { undoToast, type UndoToastHandle } from "./undo-toast";

interface ToastOptions {
  duration: number;
  action: { label: string; onClick: () => void };
  onDismiss: () => void;
  onAutoClose: () => void;
}

const open = vi.hoisted(() => new Map<string | number, ToastOptions>());

vi.mock("sonner", () => {
  let next = 0;
  const toast = Object.assign(
    vi.fn((_message: string, options: ToastOptions) => {
      const id = `toast-${++next}`;
      open.set(id, options);
      return id;
    }),
    {
      dismiss: vi.fn((id: string | number) => {
        open.get(id)?.onDismiss();
      }),
    },
  );
  return { toast };
});

afterEach(() => {
  open.clear();
  vi.clearAllMocks();
});

function lastOptions(): ToastOptions {
  return [...open.values()].at(-1)!;
}

function renderAction() {
  const { action } = lastOptions();
  render(<button onClick={action.onClick}>{action.label}</button>);
  return screen.getByRole("button", { name: action.label });
}

describe("undoToast", () => {
  it("shows an 8s toast with an Undo action by default", () => {
    undoToast({ message: "Item removed", onUndo: vi.fn() });
    expect(vi.mocked(toast).mock.calls[0][0]).toBe("Item removed");
    expect(lastOptions().duration).toBe(8000);
    expect(lastOptions().action.label).toBe("Undo");
  });

  it("honours a custom label and duration", () => {
    undoToast({ message: "Row deleted", onUndo: vi.fn(), undoLabel: "Restore", duration: 3000 });
    expect(lastOptions().duration).toBe(3000);
    expect(lastOptions().action.label).toBe("Restore");
  });

  it("runs onUndo once on a touch tap and settles undone", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onSettle = vi.fn();
    undoToast({ message: "Item removed", onUndo, onSettle });
    const button = renderAction();
    await user.pointer({ keys: "[TouchA]", target: button });
    await user.pointer({ keys: "[TouchA]", target: button });
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith("undone");
  });

  it("closes the toast after Undo", async () => {
    const user = userEvent.setup();
    const handle = undoToast({ message: "Item removed", onUndo: vi.fn() });
    await user.pointer({ keys: "[TouchA]", target: renderAction() });
    expect(toast.dismiss).toHaveBeenCalledWith(handle.id);
  });

  it("settles expired when the toast auto-closes", () => {
    const onSettle = vi.fn();
    undoToast({ message: "Item removed", onUndo: vi.fn(), onSettle });
    act(() => lastOptions().onAutoClose());
    act(() => lastOptions().onAutoClose());
    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith("expired");
    expect(toast.dismiss).not.toHaveBeenCalled();
  });

  it("settles dismissed when the vendor swipes it away", () => {
    const onSettle = vi.fn();
    undoToast({ message: "Item removed", onUndo: vi.fn(), onSettle });
    act(() => lastOptions().onDismiss());
    expect(onSettle).toHaveBeenCalledWith("dismissed");
  });

  it("dismiss() settles dismissed once, repeatably, and a late Undo does nothing", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onSettle = vi.fn();
    const handle: UndoToastHandle = undoToast({ message: "Item removed", onUndo, onSettle });
    const button = renderAction();
    handle.dismiss();
    handle.dismiss();
    await user.pointer({ keys: "[TouchA]", target: button });
    expect(onUndo).not.toHaveBeenCalled();
    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith("dismissed");
  });

  it("cannot settle twice after undo then dismiss and expiry", async () => {
    const user = userEvent.setup();
    const onSettle = vi.fn();
    const handle = undoToast({ message: "Item removed", onUndo: vi.fn(), onSettle });
    const options = lastOptions();
    await user.pointer({ keys: "[TouchA]", target: renderAction() });
    handle.dismiss();
    options.onAutoClose();
    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith("undone");
  });

  it("still settles when onUndo throws", () => {
    const onSettle = vi.fn();
    undoToast({
      message: "Item removed",
      onUndo: () => {
        throw new Error("boom");
      },
      onSettle,
    });
    expect(() => lastOptions().action.onClick()).toThrow("boom");
    expect(onSettle).toHaveBeenCalledWith("undone");
  });
});
