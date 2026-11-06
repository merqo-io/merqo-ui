"use client";

import * as React from "react";

import { isRedirectError } from "./redirect-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { buttonVariants } from "./ui/button";
import { cn } from "./lib/utils";

export interface ConfirmDialogProps {
  /** The element that opens the dialog; rendered as-is via `asChild`. Omit when `open` is controlled. */
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Confirm button text while `onConfirm` runs. Defaults to `confirmLabel`. */
  pendingLabel?: string;
  /** `destructive` paints the confirm button red. */
  variant?: "default" | "destructive";
  /**
   * Runs when the user confirms. The dialog stays open and busy until it
   * settles, closes on success, and stays open showing the thrown message
   * (or a generic one) on failure. Callers show their own success toast.
   */
  onConfirm: () => Promise<unknown> | unknown;
  /** Shown when `onConfirm` throws something without a message. */
  errorMessage?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A confirm/cancel alert dialog for actions that need a second look. Owns the
 * pending and error states so callers only supply `onConfirm`. Works
 * uncontrolled (give it a `trigger`) or controlled (`open` + `onOpenChange`).
 *
 * If `onConfirm` throws a Next.js redirect, the dialog stays busy and never
 * clears its pending state: navigation is expected to unmount it.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  pendingLabel,
  variant = "default",
  onConfirm,
  errorMessage = "Could not complete that action. Try again.",
  open: openProp,
  onOpenChange,
}: ConfirmDialogProps): React.ReactElement {
  const [openState, setOpenState] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // A ref, not state: a second click can land before the pending render.
  const inFlight = React.useRef(false);

  const open = openProp ?? openState;

  function setOpen(next: boolean) {
    if (inFlight.current) return;
    if (next) setError(null);
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  }

  async function confirm(event: React.MouseEvent) {
    // Radix closes an alert dialog on Action click; hold it open until the
    // work settles.
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    let redirecting = false;
    try {
      await onConfirm();
      inFlight.current = false;
      if (openProp === undefined) setOpenState(false);
      onOpenChange?.(false);
    } catch (err) {
      // A Next.js redirect means the page is leaving; it is not a failure.
      redirecting = isRedirectError(err);
      if (!redirecting) {
        setError(
          err instanceof Error && err.message ? err.message : errorMessage,
        );
      }
    } finally {
      inFlight.current = redirecting;
      if (!redirecting) setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={pending}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
