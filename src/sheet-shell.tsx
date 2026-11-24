"use client";

import * as React from "react";

import { AsyncSubmitButton } from "./async-submit-button";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Textarea } from "./ui/textarea";

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
        <Textarea
          id={messageId}
          value={message}
          onChange={(event) => {
            setBlankError(false);
            onMessageChange(event.target.value);
          }}
          aria-invalid={blankError || undefined}
          aria-describedby={blankError ? blankErrorId : undefined}
          className="min-h-24 flex-1 resize-none"
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
        <AsyncSubmitButton pending={pending} pendingChildren="Sending…">
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
      <Button type="button" onClick={onDone} className="w-full">
        Done
      </Button>
    </div>
  );
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
