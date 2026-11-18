import { toast } from "sonner";

/** Why an undo window closed. */
export type UndoSettleReason = "undone" | "expired" | "dismissed";

export interface UndoToastOptions {
  /** Past tense, using the verb of the control that triggered it ("Item removed"). */
  message: string;
  /** Runs at most once, when the vendor taps the action. */
  onUndo: () => void;
  /** Defaults to "Undo". */
  undoLabel?: string;
  /** Milliseconds the action stays available. Defaults to 8000. */
  duration?: number;
  /** Fires exactly once when the window closes, whichever way it closes. */
  onSettle?: (reason: UndoSettleReason) => void;
}

export interface UndoToastHandle {
  id: string | number;
  /** Withdraws Undo. Safe to call after the window has already closed. */
  dismiss: () => void;
}

// Sonner's 4s default is too short to reach an Undo action by thumb after a
// mis-tap on a phone.
export const UNDO_TOAST_MS = 8000;

/**
 * Shows an Undo toast for a reversible action that has already happened.
 * The window settles exactly once, and the toast is dismissed on every path
 * but expiry so a late tap on a closing toast cannot run onUndo.
 */
export function undoToast({
  message,
  onUndo,
  undoLabel = "Undo",
  duration = UNDO_TOAST_MS,
  onSettle,
}: UndoToastOptions): UndoToastHandle {
  let settled = false;
  let id: string | number = "";

  const settle = (reason: UndoSettleReason) => {
    if (settled) return;
    settled = true;
    if (reason !== "expired") toast.dismiss(id);
    if (reason !== "undone") onSettle?.(reason);
  };

  id = toast(message, {
    duration,
    action: {
      label: undoLabel,
      onClick: () => {
        if (settled) return;
        try {
          onUndo();
        } finally {
          settle("undone");
          onSettle?.("undone");
        }
      },
    },
    onDismiss: () => settle("dismissed"),
    onAutoClose: () => settle("expired"),
  });

  return { id, dismiss: () => settle("dismissed") };
}
