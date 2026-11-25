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
import { Alert, AlertDescription } from "./ui/alert";
import { buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
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
  /**
   * What is permanently lost, e.g. "All 42 orders for this booth." Shown
   * after the description in full-strength text and announced with it.
   */
  consequence?: React.ReactNode;
  /**
   * High-stakes gate: renders a text field and keeps the confirm button
   * disabled until the trimmed entry equals this phrase, ignoring case.
   */
  confirmPhrase?: string;
  /**
   * `destructive` paints the confirm button red. Defaults to `destructive`
   * when `confirmPhrase` is set, otherwise `default`.
   */
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

// A blank phrase would gate nothing, so it counts as no phrase.
function usablePhrase(phrase: string | undefined): string | undefined {
  return phrase?.trim() ? phrase : undefined;
}

// Case-insensitive because mobile keyboards auto-capitalise.
function phraseMatches(typed: string, phrase: string | undefined): boolean {
  if (phrase === undefined) return true;
  return typed.trim().toLowerCase() === phrase.trim().toLowerCase();
}

function ConfirmDescription({
  consequence,
  children,
}: {
  consequence?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!consequence) {
    return <AlertDialogDescription>{children}</AlertDialogDescription>;
  }
  // One described-by node holds both, so a screen reader reads the loss too.
  return (
    <AlertDialogDescription asChild>
      <div className="space-y-2">
        <div>{children}</div>
        <p className="text-sm text-foreground">{consequence}</p>
      </div>
    </AlertDialogDescription>
  );
}

function PhraseField({
  phrase,
  value,
  onChange,
  disabled,
  onSubmit,
}: {
  phrase: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onSubmit: () => void;
}) {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm">
        Type <span className="font-medium">{phrase}</span> to confirm
      </label>
      <Input
        id={id}
        size="lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) onSubmit();
        }}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
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
  variant,
  consequence,
  confirmPhrase: confirmPhraseProp,
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

  const [typed, setTyped] = React.useState("");

  const open = openProp ?? openState;
  const confirmPhrase = usablePhrase(confirmPhraseProp);
  const resolvedVariant = variant ?? (confirmPhrase !== undefined ? "destructive" : "default");
  const matched = phraseMatches(typed, confirmPhrase);

  // Reset during render, not in an effect, so a controlled parent that opens
  // the dialog never flashes the previous entry.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  function setOpen(next: boolean) {
    if (inFlight.current) return;
    if (next) setError(null);
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  }

  async function confirm(event: { preventDefault: () => void }) {
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
          <ConfirmDescription consequence={consequence}>
            {description}
          </ConfirmDescription>
        </AlertDialogHeader>
        {confirmPhrase !== undefined && (
          <PhraseField
            phrase={confirmPhrase}
            value={typed}
            onChange={setTyped}
            disabled={pending}
            onSubmit={() => {
              if (matched && !pending) void confirm({ preventDefault() {} });
            }}
          />
        )}
        {error && (
          <Alert variant="destructive" className="px-3 py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={pending || !matched}
            className={cn(
              resolvedVariant === "destructive" &&
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
