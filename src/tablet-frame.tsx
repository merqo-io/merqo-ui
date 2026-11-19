import type { ReactNode } from "react";

import { cn } from "./lib/utils";

export type TabletFrameProps = {
  label: string;
  /** Title shown in the optional top bar. */
  title?: ReactNode;
  /** Right-aligned top bar content, plain data (text, counts). */
  topBarEnd?: ReactNode;
  className?: string;
  children: ReactNode;
};

// A tablet is a real object, so like PhoneFrame it keeps device corners and a
// bezel in both colour schemes; the camera dot is decorative.
export function TabletFrame({
  label,
  title,
  topBarEnd,
  className,
  children,
}: TabletFrameProps) {
  const hasBar = title !== undefined || topBarEnd !== undefined;
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative flex shrink-0 flex-col rounded-3xl border border-neutral-600 bg-neutral-900 p-3 dark:border-neutral-500 dark:bg-neutral-950",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full bg-neutral-600 dark:bg-neutral-500"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background text-foreground">
        {hasBar && (
          <div className="flex flex-none items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
            <span className="font-semibold">{title}</span>
            <span className="flex items-center gap-4 text-sm">{topBarEnd}</span>
          </div>
        )}
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
