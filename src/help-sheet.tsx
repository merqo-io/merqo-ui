"use client";

import * as React from "react";

import { SegmentedControl } from "./segmented-control";
import { isRedirectError } from "./redirect-error";
import { SheetMessageForm, SheetShell, toErrorMessage } from "./sheet-shell";
import { useAsyncAction } from "./use-async-action";

export interface SupportRequest {
  message: string;
  category?: string;
}

export type HelpSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional hook for a consuming kit's own toast/notification on async failure. */
  onError?: (error: unknown) => void;
} & (
  | { mode: "mailto"; address: string }
  | {
      mode: "form";
      onSubmit: (data: SupportRequest) => Promise<void>;
      categories?: { value: string; label: string }[];
      title?: string;
      description?: string;
    }
);

export function HelpSheet(props: HelpSheetProps) {
  const { open, onOpenChange, onError } = props;

  const title =
    props.mode === "form" ? props.title ?? "Get help" : "Get help";
  const description =
    props.mode === "mailto"
      ? "Reach out and we'll get back to you."
      : props.description ?? "Tell us what you're stuck on.";

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {props.mode === "mailto" ? (
        <div className="px-4">
          <a
            href={`mailto:${props.address}`}
            className="text-primary text-sm font-medium underline underline-offset-4"
          >
            Email support
          </a>
        </div>
      ) : (
        <HelpForm
          onSubmit={props.onSubmit}
          onOpenChange={onOpenChange}
          onError={onError}
          categories={props.categories}
        />
      )}
    </SheetShell>
  );
}

function HelpForm({
  onSubmit,
  onOpenChange,
  onError,
  categories,
}: {
  onSubmit: (data: SupportRequest) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onError?: (error: unknown) => void;
  categories?: { value: string; label: string }[];
}) {
  const [message, setMessage] = React.useState("");
  const [category, setCategory] = React.useState<string | undefined>(categories?.[0]?.value);

  const { pending, error, run } = useAsyncAction(async () => {
    if (!message.trim()) return;
    const payload: SupportRequest = { message };
    if (categories && category) {
      payload.category = category;
    }
    await onSubmit(payload);
    setMessage("");
    setCategory(categories?.[0]?.value);
    onOpenChange(false);
  });

  return (
    <SheetMessageForm
      messageId="help-message"
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
      {categories && categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <SegmentedControl
            variant="pill"
            ariaLabel="What's it about?"
            className="grid-cols-2 gap-1.5"
            value={category ?? null}
            onChange={setCategory}
            options={categories.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>
      )}
    </SheetMessageForm>
  );
}
