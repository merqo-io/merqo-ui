"use client";

import * as React from "react";

import { cn } from "./lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  /** Accessible name override; only needed when `label` isn't readable text (an icon, a bare number). */
  ariaLabel?: string;
  /** Skipped by arrow-key navigation and not selectable. */
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  ariaLabel: string;
  options: readonly SegmentedOption<T>[];
  /** `null` when nothing is chosen yet; the first enabled option then takes the Tab stop. */
  value: T | null;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  /**
   * `track` (default) is a bordered row with a tinted active pill, for view
   * switches. `pill` renders each option as its own bordered button, for
   * score and category grids.
   */
  variant?: "track" | "pill";
  /** Layout classes for the group, e.g. `grid grid-cols-3 gap-1`. */
  className?: string;
  /** Extra classes on every option button, e.g. `tabular-nums`. */
  optionClassName?: string;
}

const TRACK_SIZE = {
  md: { group: "text-sm", item: "px-3 py-1.5" },
  sm: { group: "text-xs", item: "px-2.5 py-1" },
} as const;

/**
 * A row of mutually exclusive options, used for view switches (sort order,
 * date range) and pill grids (a 0-10 score, a category picker). Follows the
 * WAI-ARIA radio group pattern: one Tab stop for the whole group (the checked
 * option, or the first enabled one before anything is checked); arrow keys
 * move focus and selection together, wrapping at the ends, skipping disabled
 * options; Home and End jump to the first and last enabled option. A disabled
 * option is never reported as checked, so the Tab stop and `aria-checked`
 * always agree. Option values must be unique: they are used as React keys.
 */
export function SegmentedControl<T extends string = string>({
  ariaLabel,
  options,
  value,
  onChange,
  size = "md",
  variant = "track",
  className,
  optionClassName,
}: SegmentedControlProps<T>): React.ReactElement {
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.flatMap((option, index) =>
    option.disabled ? [] : [index],
  );
  const checkedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const rovingIndex = checkedIndex === -1 ? (enabled[0] ?? 0) : checkedIndex;

  function moveTo(position: number) {
    if (enabled.length === 0) return;
    const wrapped = (position + enabled.length) % enabled.length;
    const index = enabled[wrapped];
    onChange(options[index].value);
    buttonRefs.current[index]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const position = enabled.indexOf(rovingIndex);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(position + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(position - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(enabled.length - 1);
        break;
      default:
        break;
    }
  }

  const track = variant === "track";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        track
          ? ["inline-flex rounded-lg border border-border p-0.5", TRACK_SIZE[size].group]
          : "grid",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => {
        const checked = option.value === value && !option.disabled;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            tabIndex={index === rovingIndex ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              track
                ? [
                    // Finger-sized on a touch screen whatever the mouse size.
                    "rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [@media(pointer:coarse)]:min-h-11",
                    TRACK_SIZE[size].item,
                    checked
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  ]
                : [
                    "flex items-center justify-center rounded-md border px-2 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:border-primary/50",
                  ],
              optionClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
