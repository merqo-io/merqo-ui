"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useAsyncAction } from "./use-async-action";

export interface DownloadButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
  label?: React.ReactNode;
  /** Shown while `onDownload` runs; defaults to `label`. */
  pendingLabel?: React.ReactNode;
  /** Build and save the file, usually with `downloadBlob`. */
  onDownload: () => Promise<void> | void;
  /** Called when `onDownload` rejects; the button re-enables either way. */
  onError?: (error: unknown) => void;
}

/** Button that runs an async export and stays disabled and busy until it settles. */
export function DownloadButton({
  label = "Download",
  pendingLabel,
  onDownload,
  onError,
  disabled,
  variant = "outline",
  size = "sm",
  ...props
}: DownloadButtonProps) {
  const action = React.useCallback(async () => {
    await onDownload();
  }, [onDownload]);
  const { pending, run } = useAsyncAction(action);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      {...props}
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={() => {
        run().catch((err: unknown) => onError?.(err));
      }}
    >
      {pending ? (
        <Spinner className={size === "xs" || size === "icon-xs" ? "size-3" : undefined} aria-hidden="true" />
      ) : (
        <Download aria-hidden="true" />
      )}
      {pending ? (pendingLabel ?? label) : label}
    </Button>
  );
}
