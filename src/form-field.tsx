import * as React from "react";

import { cn } from "./lib/utils";

/** Shared field-label style across the vendor form pages. */
export const FORM_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Shared inline field-error style; kits reuse it on error text they render themselves. */
export const FORM_ERROR_CLASS = "text-sm font-medium text-destructive";

export interface FormErrorProps {
  message: string | null | undefined;
  id?: string;
  className?: string;
}

/** Inline field error, announced to assistive tech; renders nothing without a message. */
export function FormError({ message, id, className }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn(FORM_ERROR_CLASS, className)}
    >
      {message}
    </p>
  );
}
