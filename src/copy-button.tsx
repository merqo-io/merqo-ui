"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "./ui/button";
import { LiveRegion } from "./live-region";

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

  const mounted = React.useRef(true);
  // Remounting the status span per copy makes a repeat copy within the reset
  // window announce again; unchanged live-region text is not re-read.
  const [copyCount, setCopyCount] = React.useState(0);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
    } catch (err) {
      onError?.(err);
      return;
    }
    if (!mounted.current) return;
    setCopied(true);
    setCopyCount((n) => n + 1);
    onCopied?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }

  return (
    <span className="inline-flex">
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
      <LiveRegion message={copied ? copiedLabel : null} announceKey={copyCount} />
    </span>
  );
}
