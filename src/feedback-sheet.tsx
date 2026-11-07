"use client";

import * as React from "react";

import { SegmentedControl } from "./segmented-control";
import { isRedirectError } from "./redirect-error";
import { SheetMessageForm, SheetShell, toErrorMessage } from "./sheet-shell";
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
  onError,
}: FeedbackSheetProps) {
  const [message, setMessage] = React.useState("");
  const [score, setScore] = React.useState<number | null>(null);
  const [npsValidationError, setNpsValidationError] = React.useState(false);

  const { pending, error, run } = useAsyncAction(async () => {
    if (showNps) {
      if (score === null) {
        setNpsValidationError(true);
        return;
      }
    } else if (!message.trim()) {
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
    onOpenChange(false);
  });

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <SheetMessageForm
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
            <SegmentedControl
              variant="pill"
              ariaLabel="Recommend score, 0 to 10"
              className="grid-cols-11 gap-1"
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
            {npsValidationError && (
              <p className="text-destructive text-sm" role="alert">
                Pick a score first
              </p>
            )}
          </div>
        )}
      </SheetMessageForm>
    </SheetShell>
  );
}
