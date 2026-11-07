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
  children,
}: {
  messageId: string;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  pending: boolean;
  errorMessage?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <form
      className="flex flex-1 flex-col gap-4 px-4"
      onSubmit={(event) => {
        event.preventDefault();
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
          onChange={(event) => onMessageChange(event.target.value)}
          className="border-input bg-background flex-1 min-h-24 resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <SheetFooter className="px-0 pb-4">
        <AsyncSubmitButton pending={pending} pendingChildren="Sending…" className="py-2">
          Send
        </AsyncSubmitButton>
      </SheetFooter>
    </form>
  );
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
