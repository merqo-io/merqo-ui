"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "./lib/utils";
import { Button } from "./ui/button";

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
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn("gap-1.5 has-[>svg]:px-4", className)}
    >
      {pending ? (
        <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? (pendingChildren ?? children) : children}
    </Button>
  );
}
