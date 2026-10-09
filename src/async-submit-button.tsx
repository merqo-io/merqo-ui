"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "./lib/utils";

export interface AsyncSubmitButtonProps {
  pending: boolean;
  children: React.ReactNode;
  /** Shown instead of `children` while pending (e.g. "Signing out…").
   *  Omit to keep the same label and rely on the spinner + disabled state
   *  alone to signal pending. */
  pendingChildren?: React.ReactNode;
  className?: string;
}

/** Shared submit button with an accessible pending state and optional pending label. */
export function AsyncSubmitButton({
  pending,
  children,
  pendingChildren,
  className,
}: AsyncSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
