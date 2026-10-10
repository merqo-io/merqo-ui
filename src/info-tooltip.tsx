"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "./lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface InfoTooltipProps {
  content: React.ReactNode;
  ariaLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** "hover" (default) shows on hover, keyboard focus and tap via a Tooltip;
   *  a second tap, a tap elsewhere or Escape closes it. "tap" shows on click
   *  only, via a Popover, for richer content that should stay put. */
  trigger?: "hover" | "tap";
  triggerClassName?: string;
  iconClassName?: string;
  contentClassName?: string;
}

export function InfoTooltip({
  content,
  ariaLabel = "More info",
  icon: Icon = Info,
  trigger = "hover",
  triggerClassName,
  iconClassName,
  contentClassName,
}: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);
  // Radix closes the Tooltip on the trigger's pointerdown, before the click
  // lands, so the click handler alone cannot tell "tap to open" from "tap to
  // close". null means the click had no pointerdown (keyboard Enter/Space).
  const openAtPointerDown = React.useRef<boolean | null>(null);

  const triggerButton = (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-4 items-center justify-center rounded-full outline-none focus-visible:ring-2",
        triggerClassName,
      )}
    >
      <Icon className={cn("size-3.5", iconClassName)} />
    </button>
  );

  if (trigger === "tap") {
    return (
      <Popover>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          className={cn("text-muted-foreground", contentClassName)}
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        asChild
        onPointerDown={() => {
          openAtPointerDown.current = open;
        }}
        onClick={(event) => {
          // Radix's own click handler only ever closes, which leaves a touch
          // user (no hover, no focus-on-tap) with no way to open the Tooltip.
          // preventDefault() skips it so a click toggles instead.
          event.preventDefault();
          const wasOpen = openAtPointerDown.current ?? open;
          openAtPointerDown.current = null;
          setOpen(!wasOpen);
        }}
      >
        {triggerButton}
      </TooltipTrigger>
      <TooltipContent className={contentClassName}>{content}</TooltipContent>
    </Tooltip>
  );
}
