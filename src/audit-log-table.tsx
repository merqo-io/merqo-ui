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

const GRID_COLS = "grid-cols-[1fr_1fr_1fr_auto]";

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
        className={`grid ${GRID_COLS} gap-x-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground`}
      >
        <span>Action</span>
        <span>Actor</span>
        <span>Target</span>
        <span className="text-right">When</span>
      </div>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`grid ${GRID_COLS} items-baseline gap-x-4 border-t border-border px-5 py-3 text-sm`}
        >
          <span>
            {formatAction ? formatAction(entry.action) : humaniseAction(entry.action)}
            {entry.detail ? (
              <span className="block text-xs text-muted-foreground">{entry.detail}</span>
            ) : null}
          </span>
          <span className="text-muted-foreground">{entry.actor}</span>
          <span className="text-muted-foreground">{entry.target ? entry.target : <span className="sr-only">No target</span>}</span>
          <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
            {formatTimestamp(entry.createdAt, dateFormatter)}
          </span>
        </div>
      ))}
    </div>
  );
}
