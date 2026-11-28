"use client";

import * as React from "react";

import { cn } from "./lib/utils";
import { MOTION_STATE } from "./recipes";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  /** Accessible name override; only needed when `label` isn't readable text (an icon, a bare number). */
  ariaLabel?: string;
  /** Skipped by arrow-key navigation and not selectable. */
  disabled?: boolean;
}

export interface SegmentedLinkOption {
  label: React.ReactNode;
  href: string;
  /** Marks the current page; gets `aria-current="page"`. */
  selected?: boolean;
  /** Accessible name override; only needed when `label` isn't readable text. */
  ariaLabel?: string;
}

interface SegmentedBaseProps {
  ariaLabel: string;
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

export interface SegmentedValueProps<T extends string = string>
  extends SegmentedBaseProps {
  options: readonly SegmentedOption<T>[];
  /** `null` when nothing is chosen yet; the first enabled option then takes the Tab stop. */
  value: T | null;
  onChange: (value: T) => void;
  LinkComponent?: never;
}

/**
 * Link mode: each option navigates, so the control renders a `<nav>` of links
 * instead of a radio group. It has no `value` or `onChange`; the page marks
 * the current option with `selected`.
 */
export interface SegmentedLinkProps extends SegmentedBaseProps {
  options: readonly SegmentedLinkOption[];
  /** Link element, e.g. `next/link`. Defaults to `a`. */
  LinkComponent?: React.ElementType;
  value?: never;
  onChange?: never;
}

export type SegmentedControlProps<T extends string = string> =
  | SegmentedValueProps<T>
  | SegmentedLinkProps;

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
export function SegmentedControl<T extends string = string>(
  props: SegmentedControlProps<T>,
): React.ReactElement {
  if (props.options.length > 0 && "href" in props.options[0]) {
    return <SegmentedLinks {...(props as SegmentedLinkProps)} />;
  }
  return <SegmentedValue {...(props as SegmentedValueProps<T>)} />;
}

function linkClasses(
  track: boolean,
  size: "sm" | "md",
  selected: boolean,
): (string | false)[] {
  return track
    ? [
        "relative inline-flex items-center justify-center rounded-md font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-colors motion-reduce:transition-none pointer-coarse:min-h-11",
        TRACK_SIZE[size].item,
        selected
          ? "bg-primary/10 text-primary active:bg-primary/20"
          : "text-muted-foreground hover:text-foreground active:bg-primary/10 active:text-foreground",
      ]
    : [
        "flex items-center justify-center rounded-md border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 px-2 py-2 pointer-coarse:min-h-11 text-sm font-medium transition-colors motion-reduce:transition-none",
        selected
          ? "border-primary bg-primary text-primary-foreground active:bg-primary/80"
          : "border-input text-muted-foreground hover:border-primary/50 active:border-primary active:bg-primary/10",
      ];
}

function SegmentedLinks({
  ariaLabel,
  options,
  LinkComponent = "a",
  size = "md",
  variant = "track",
  className,
  optionClassName,
}: SegmentedLinkProps): React.ReactElement {
  const track = variant === "track";
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        track
          ? ["relative inline-flex rounded-lg border border-border p-0.5", TRACK_SIZE[size].group]
          : "grid",
        className,
      )}
    >
      {options.map((option) => (
        <LinkComponent
          key={option.href}
          href={option.href}
          aria-label={option.ariaLabel}
          aria-current={option.selected ? "page" : undefined}
          className={cn(linkClasses(track, size, !!option.selected), optionClassName)}
        >
          {option.label}
        </LinkComponent>
      ))}
    </nav>
  );
}

function SegmentedValue<T extends string = string>({
  ariaLabel,
  options,
  value,
  onChange,
  size = "md",
  variant = "track",
  className,
  optionClassName,
}: SegmentedValueProps<T>): React.ReactElement {
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.flatMap((option, index) =>
    option.disabled ? [] : [index],
  );
  const checkedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const rovingIndex = checkedIndex === -1 ? (enabled[0] ?? 0) : checkedIndex;
  const groupRef = React.useRef<HTMLDivElement | null>(null);
  const [pill, setPill] = React.useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    slides: boolean;
  } | null>(null);
  const track = variant === "track";

  const indicatorShown = pill !== null && pill.w > 0 && pill.h > 0;
  const optionsKey = options.map((option) => option.value).join("\u0000");
  const lastChecked = React.useRef(-1);

  // The pill is measured from the checked button so it follows any label
  // width, size or wrapped layout. It only animates when the checked option
  // changes; mount and size-only re-measures (rotation, font load, sibling
  // reflow) snap, so the pill never slides in from the corner or lags a resize.
  React.useLayoutEffect(() => {
    const el = checkedIndex === -1 || !track ? null : buttonRefs.current[checkedIndex];
    if (!el) {
      lastChecked.current = -1;
      setPill(null);
      return;
    }
    const changed = lastChecked.current !== -1 && lastChecked.current !== checkedIndex;
    lastChecked.current = checkedIndex;
    function measure(animate: boolean) {
      if (!el) return;
      setPill((prev) => {
        const next = {
          x: el.offsetLeft,
          y: el.offsetTop,
          w: el.offsetWidth,
          h: el.offsetHeight,
          slides: animate && prev !== null,
        };
        return prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
          ? { ...prev, slides: animate }
          : next;
      });
    }
    measure(changed);
    const remeasure = () => measure(false);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remeasure);
    if (observer) {
      if (groupRef.current) observer.observe(groupRef.current);
      for (const button of buttonRefs.current) if (button) observer.observe(button);
    }
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) remeasure();
      });
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [checkedIndex, track, size, optionsKey]);

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

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        track
          ? ["relative inline-flex rounded-lg border border-border p-0.5", TRACK_SIZE[size].group]
          : "grid",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {track && pill && (
        <span
          aria-hidden="true"
          data-slot="segmented-indicator"
          className={cn(
            "pointer-events-none absolute top-0 left-0 rounded-md bg-primary/10 transition-[transform,width,height]",
            MOTION_STATE,
            "motion-reduce:duration-1!",
            !pill.slides && "transition-none",
          )}
          style={{ width: pill.w, height: pill.h, transform: `translate(${pill.x}px, ${pill.y}px)` }}
        />
      )}
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
                    "relative rounded-md font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-colors motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11",
                    TRACK_SIZE[size].item,
                    checked
                      ? [
                          "text-primary active:bg-primary/20",
                          // Until the indicator has a measured size (server render, no layout) the button carries the tint itself.
                          !indicatorShown && "bg-primary/10",
                        ]
                      : "text-muted-foreground hover:text-foreground active:bg-primary/10 active:text-foreground",
                  ]
                : [
                    "flex items-center justify-center rounded-md border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 px-2 py-2 pointer-coarse:min-h-11 text-sm font-medium transition-colors motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50",
                    checked
                      ? "border-primary bg-primary text-primary-foreground active:bg-primary/80"
                      : "border-input text-muted-foreground hover:border-primary/50 active:border-primary active:bg-primary/10",
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
