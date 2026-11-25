"use client";

import * as React from "react";

import { SegmentedControl } from "./segmented-control";
import { isRedirectError } from "./redirect-error";
import { SheetConfirmation, SheetMessageForm, SheetShell, toErrorMessage } from "./sheet-shell";
import { Alert, AlertDescription } from "./ui/alert";
import { useAsyncAction } from "./use-async-action";

export interface FeedbackData {
  message: string;
  source: string;
  metric?: string;
  nps?: number;
}

export interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FeedbackData) => Promise<void>;
  source?: string;
  metric?: string;
  showNps?: boolean;
  title?: string;
  description?: string;
  /** Visible question above the 0-10 score row; also the row's accessible name. */
  npsLabel?: string;
  /** Optional hook for a consuming kit's own toast/notification on async failure. */
  onError?: (error: unknown) => void;
}

export function FeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  source = "vendor",
  metric,
  showNps,
  title = "Feedback",
  description = "Tell us what's working, or what isn't.",
  npsLabel = "How likely are you to recommend us?",
  onError,
}: FeedbackSheetProps) {
  // The draft lives here, not in the sheet content, so an accidental dismiss
  // (swipe, tap outside, Escape) keeps it. It resets only after a send.
  const [message, setMessage] = React.useState("");
  const [score, setScore] = React.useState<number | null>(null);
  const [npsValidationError, setNpsValidationError] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  // Any close, including one that lands after a send resolved mid-flight,
  // drops the confirmation so the next open shows the empty form.
  if (!open && sent) setSent(false);

  const { pending, error, run } = useAsyncAction(async () => {
    if (showNps && score === null) {
      setNpsValidationError(true);
      return;
    }
    const payload: FeedbackData = { message, source, metric };
    if (showNps && score !== null) {
      payload.nps = score;
    }
    await onSubmit(payload);
    setMessage("");
    setScore(null);
    setNpsValidationError(false);
    setSent(true);
  });

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {sent ? (
        <SheetConfirmation
          title="Feedback sent"
          body="Thanks. We read every message."
          onDone={() => onOpenChange(false)}
        />
      ) : (
        <SheetMessageForm
          messageRequired={!showNps}
          messageId="feedback-message"
          message={message}
          onMessageChange={setMessage}
          pending={pending}
          errorMessage={error ? toErrorMessage(error) : null}
          onSubmit={() => {
            run().catch((err) => {
              if (!isRedirectError(err)) onError?.(err);
            });
          }}
        >
          {showNps && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{npsLabel}</p>
              <SegmentedControl
                variant="pill"
                ariaLabel={npsLabel}
                className="grid-cols-6 gap-1.5"
                optionClassName="tabular-nums"
                value={score === null ? null : String(score)}
                onChange={(v) => {
                  setScore(Number(v));
                  setNpsValidationError(false);
                }}
                options={Array.from({ length: 11 }, (_, i) => ({
                  value: String(i),
                  label: i,
                  ariaLabel: String(i),
                }))}
              />
              <p className="text-muted-foreground text-sm">
                0 is not likely, 10 is very likely
              </p>
              {npsValidationError && (
                <Alert variant="destructive" className="px-3 py-2">
                  <AlertDescription>Pick a score first</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </SheetMessageForm>
      )}
    </SheetShell>
  );
}
