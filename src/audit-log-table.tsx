import * as React from "react";
import { cn } from "./lib/utils";
import { GROUP } from "./recipes";

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target?: string | null;
  detail?: string | null;
  createdAt: string | Date;
}

export interface AuditLogTableProps {
  entries: AuditLogEntry[];
  /** Maps a raw action string (e.g. "set_vendor_plan") to a human label. Omit to render a humanised label ("Set vendor plan"). */
  formatAction?: (action: string) => string;
  emptyState?: React.ReactNode;
  /** Overrides the default Intl.DateTimeFormat rendering of `createdAt`. */
  dateFormatter?: (date: Date) => string;
}

function humaniseAction(action: string) {
  const spaced = action.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const GRID_COLS = "sm:grid-cols-[1fr_1fr_1fr_auto]";

function formatTimestamp(value: string | Date, dateFormatter?: (date: Date) => string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (dateFormatter) return dateFormatter(date);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AuditLogTable({ entries, formatAction, emptyState, dateFormatter }: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <div className={cn(GROUP, "border-border px-5 py-8 text-center text-sm text-muted-foreground")}>
        {emptyState ?? "No activity recorded yet."}
      </div>
    );
  }

  return (
    <div className={cn(GROUP, "overflow-hidden border-border")}>
      <div
        className={`hidden ${GRID_COLS} sm:gap-x-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid`}
      >
        <span>Action</span>
        <span>Actor</span>
        <span>Target</span>
        <span className="text-right">When</span>
      </div>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex flex-col gap-1 border-t border-border px-5 py-3 text-sm sm:grid ${GRID_COLS} sm:items-baseline sm:gap-x-4`}
        >
          <span className="min-w-0 break-words">
            {formatAction ? formatAction(entry.action) : humaniseAction(entry.action)}
            {entry.detail ? (
              <span className="block text-xs text-muted-foreground">{entry.detail}</span>
            ) : null}
          </span>
          <span className="min-w-0 break-words text-muted-foreground">
            <span className="mr-1 text-xs font-medium sm:hidden">Actor</span>
            {entry.actor}
          </span>
          <span className="min-w-0 break-words text-muted-foreground">
            {entry.target ? (
              <>
                <span className="mr-1 text-xs font-medium sm:hidden">Target</span>
                {entry.target}
              </>
            ) : (
              <span className="sr-only">No target</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground sm:whitespace-nowrap sm:text-right">
            {formatTimestamp(entry.createdAt, dateFormatter)}
          </span>
        </div>
      ))}
    </div>
  );
}
