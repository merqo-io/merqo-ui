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
  /** "hover" (default) shows on hover/focus via a Tooltip. "tap" shows on
   *  click via a Popover — for touch-first flows where hover never fires. */
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
    <Tooltip>
      <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
      <TooltipContent className={contentClassName}>{content}</TooltipContent>
    </Tooltip>
  );
}
