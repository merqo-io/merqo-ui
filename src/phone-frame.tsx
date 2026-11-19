import type { ReactNode } from "react";

import { cn } from "./lib/utils";

export type PhoneFrameProps = {
  label: string;
  size?: "large" | "small";
  className?: string;
  children: ReactNode;
  /**
   * Opt-in device hardware: bezel, camera island, side keys and a status bar.
   * Implied by `browserBar`. Off by default so existing kits render the plain
   * frame unchanged.
   */
  realistic?: boolean;
  /** Safari-style bottom bar showing `url` as visible text. Implies `realistic`. */
  browserBar?: { url: string };
  /** Status bar clock, realistic mode only. */
  statusTime?: string;
};

const DEVICE =
  "border-neutral-600 bg-neutral-900 dark:border-neutral-500 dark:bg-neutral-950";
const KEY = "absolute w-0.5 rounded-full bg-neutral-600 dark:bg-neutral-500";

function StatusIcons() {
  return (
    <span aria-hidden className="flex items-center gap-1">
      <svg viewBox="0 0 18 12" fill="currentColor" className="h-2.5 w-auto">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg
        viewBox="0 0 27 12"
        fill="none"
        stroke="currentColor"
        className="h-2.5 w-auto"
      >
        <rect x=".5" y=".5" width="22" height="11" rx="3" opacity=".45" />
        <rect
          x="2.5"
          y="2.5"
          width="15"
          height="7"
          rx="1.5"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M24.5 4v4"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity=".45"
        />
      </svg>
    </span>
  );
}

// A phone is a real object, so it keeps a phone's corners; a kit can override
// the radius through className.
export function PhoneFrame({
  label,
  size = "large",
  className,
  children,
  realistic = false,
  browserBar,
  statusTime = "9:41",
}: PhoneFrameProps) {
  const dims = size === "large" ? "h-[400px] w-[232px]" : "h-[250px] w-[190px]";

  if (!realistic && !browserBar) {
    return (
      <div
        role="group"
        aria-label={label}
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden rounded-3xl border-2 border-foreground bg-card px-3 pb-3 pt-4",
          dims,
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative flex shrink-0 rounded-3xl border p-1",
        DEVICE,
        dims,
        className,
      )}
    >
      <span aria-hidden className={cn(KEY, "-left-1 top-16 h-6")} />
      <span aria-hidden className={cn(KEY, "-left-1 top-28 h-6")} />
      <span aria-hidden className={cn(KEY, "-right-1 top-20 h-10")} />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card text-foreground">
        <span
          aria-hidden
          className="absolute left-1/2 top-1.5 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-950"
        />
        <div
          aria-hidden
          className="flex h-7 flex-none items-center justify-between px-4 pt-1 text-[10px] font-bold"
        >
          <span>{statusTime}</span>
          <StatusIcons />
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">{children}</div>
        {browserBar && (
          <div className="flex flex-none items-center gap-2 border-t border-border bg-muted px-3 pb-3 pt-2 text-[10px]">
            <span aria-hidden className="font-bold">
              aA
            </span>
            <span className="flex h-6 min-w-0 flex-1 items-center justify-center rounded-lg bg-card font-semibold">
              <span className="truncate">{browserBar.url}</span>
            </span>
            <span aria-hidden className="font-bold">
              &#8635;
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
