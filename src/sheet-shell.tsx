"use client";

import * as React from "react";

import { AsyncSubmitButton } from "./async-submit-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

/** Private: the drawer frame HelpSheet and FeedbackSheet share. Not exported from the package. */
export function SheetShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Private: message textarea, inline error and Send button; `children` render above the textarea. */
export function SheetMessageForm({
  messageId,
  message,
  onMessageChange,
  onSubmit,
  pending,
  errorMessage,
  messageRequired = true,
  children,
}: {
  messageId: string;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  pending: boolean;
  errorMessage?: string | null;
  /** When true, a blank message shows an inline error instead of calling `onSubmit`. */
  messageRequired?: boolean;
  children?: React.ReactNode;
}) {
  const [blankError, setBlankError] = React.useState(false);
  const blankErrorId = `${messageId}-error`;
  return (
    <form
      className="flex flex-1 flex-col gap-4 px-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (messageRequired && !message.trim()) {
          setBlankError(true);
          return;
        }
        onSubmit();
      }}
    >
      {children}
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor={messageId} className="text-sm font-medium">
          Message
        </label>
        <textarea
          id={messageId}
          value={message}
          onChange={(event) => {
            setBlankError(false);
            onMessageChange(event.target.value);
          }}
          aria-invalid={blankError || undefined}
          aria-describedby={blankError ? blankErrorId : undefined}
          className="border-input bg-background flex-1 min-h-24 resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {blankError ? (
          <p id={blankErrorId} className="text-destructive text-sm" role="alert">
            Write a message first
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <SheetFooter className="px-0 pb-4">
        <AsyncSubmitButton pending={pending} pendingChildren="Sending…" className="py-2 pointer-coarse:min-h-11">
          Send
        </AsyncSubmitButton>
      </SheetFooter>
    </form>
  );
}

/** Private: replaces the form inside the open sheet once a send succeeds. */
export function SheetConfirmation({
  title,
  body,
  onDone,
}: {
  title: string;
  body: string;
  onDone: () => void;
}) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <div role="status" className="flex flex-1 flex-col gap-1">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-medium outline-none"
        >
          {title}
        </h3>
        <p className="text-muted-foreground text-sm">{body}</p>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-sm font-medium"
      >
        Done
      </button>
    </div>
  );
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
