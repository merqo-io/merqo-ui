"use client";

import * as React from "react";

import { cn } from "./lib/utils";
import { formatDateTime, formatRelativeTime } from "./time";
import type { DateInput } from "./time";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const TICK_MS = 60_000;

// One interval for every mounted instance, so a long list does not run a
// timer per row. It stops while the tab is hidden and catches up on return.
const listeners = new Set<() => void>();
let snapshot: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function notify() {
  snapshot = Date.now();
  listeners.forEach((listener) => listener());
}

function startTimer() {
  if (timer === null && !document.hidden) timer = setInterval(notify, TICK_MS);
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function onVisibilityChange() {
  if (document.hidden) {
    stopTimer();
  } else {
    notify();
    startTimer();
  }
}

function subscribe(listener: () => void) {
  snapshot = Date.now();
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    startTimer();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopTimer();
    }
  };
}

function noopSubscribe() {
  return () => {};
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return null;
}

export interface RelativeTimestampProps {
  value: DateInput;
  isoString: string;
  now?: DateInput;
  className?: string;
}

export function RelativeTimestamp({ value, isoString, now, className }: RelativeTimestampProps) {
  const [open, setOpen] = React.useState(false);
  // Null on the server and during hydration; the store supplies the clock
  // once mounted.
  const storeNow = React.useSyncExternalStore(
    now === undefined ? subscribe : noopSubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const exact = formatDateTime(value);
  const reference = now ?? storeNow;
  // The server and the first client render both show the absolute time, so
  // hydration never disagrees about what "ago" means.
  const text = reference === null ? exact : formatRelativeTime(value, reference);
  const label = reference === null ? exact : `${text}, ${exact}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <time
          dateTime={isoString}
          tabIndex={0}
          role="button"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((current) => !current);
            }
          }}
          className={cn(
            "relative cursor-pointer rounded-sm tabular-nums underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 after:absolute after:-inset-x-2 after:-inset-y-3",
            className,
          )}
        >
          {text}
        </time>
      </PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-2">{exact}</PopoverContent>
    </Popover>
  );
}
