"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { StatusCard } from "./status-card";

type ErrorWithDigest = Error & { digest?: string };

export interface ErrorPageProps {
  error: ErrorWithDigest;
  reset: () => void;
  /** Kit wordmark shown above the card. */
  wordmark?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  resetLabel?: string;
  /** Extra actions under the retry button, e.g. a link home. */
  actions?: React.ReactNode;
  /** Replaces the default `console.error` report. */
  onError?: (error: ErrorWithDigest) => void;
}

/**
 * Body for a kit's `app/error.tsx`. Reports the error once, offers a retry
 * and shows Next's digest so a vendor can quote it to support.
 */
export function ErrorPage({
  error,
  reset,
  wordmark,
  eyebrow,
  title = "Something went wrong",
  description = "Could not load this page. This is usually a flaky connection, so try again.",
  resetLabel = "Try again",
  actions,
  onError,
}: ErrorPageProps): React.ReactElement {
  React.useEffect(() => {
    if (onError) onError(error);
    else console.error("Unhandled error", error);
  }, [error, onError]);

  return (
    <StatusCard wordmark={wordmark} eyebrow={eyebrow} title={title} description={description}>
      <Button type="button" onClick={() => reset()} className="h-11 w-full">
        {resetLabel}
      </Button>
      {actions}
      {error.digest ? (
        <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
    </StatusCard>
  );
}

export interface GlobalErrorColors {
  background: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
}

export interface GlobalErrorProps {
  error?: ErrorWithDigest;
  reset: () => void;
  /** The kit's own token values (copies of its CSS variable values), not new
   *  ad-hoc colours. Required because the app stylesheet has not loaded when
   *  the root layout itself has thrown. */
  colors: GlobalErrorColors;
  /** CSS border-radius for the button. Unset gives square corners. */
  radius?: string;
  /** Omit to inherit the browser default. */
  fontFamily?: string;
  lang?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  resetLabel?: string;
}

/**
 * Body for `app/global-error.tsx`. Next renders it in place of the root
 * layout, so it ships its own html and body and styles inline.
 */
export function GlobalError({
  reset,
  colors,
  fontFamily,
  radius,
  lang = "en",
  title = "Something went wrong",
  description = "An unexpected error interrupted the page. Try again, and if it keeps happening, refresh in a moment.",
  resetLabel = "Try again",
}: GlobalErrorProps): React.ReactElement {
  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.background,
          color: colors.foreground,
          fontFamily,
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "24rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>{title}</h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: colors.mutedForeground,
              margin: "0 0 1.5rem",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: radius,
              background: colors.primary,
              color: colors.primaryForeground,
              fontSize: "0.9rem",
              fontWeight: 600,
              minHeight: "2.75rem",
              padding: "0.7rem 1.25rem",
            }}
          >
            {resetLabel}
          </button>
        </main>
      </body>
    </html>
  );
}
