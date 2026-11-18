"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "./ui/button";

const RESET_MS = 2000;

export interface CopyButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children" | "value"> {
  /** Text written to the clipboard. */
  value: string;
  label?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  onCopied?: () => void;
  /** Called when the clipboard write fails or is unavailable. No copied state is shown. */
  onError?: (error: unknown) => void;
}

/** Copies `value` on tap, swaps to a check and `copiedLabel` for 2s, and announces it politely. */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  onCopied,
  onError,
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
    } catch (err) {
      onError?.(err);
      return;
    }
    setCopied(true);
    onCopied?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        {...props}
        onClick={() => void copy()}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? copiedLabel : label}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
