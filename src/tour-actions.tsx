"use client";

import * as React from "react";

import { Button } from "./ui/button";

export interface TourActionsLabels {
  back?: string;
  next?: string;
  skip?: string;
  finish?: string;
  progress?: (index: number, total: number) => string;
}

export interface TourActionsProps {
  /** 0-based index of the current step. */
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  labels?: TourActionsLabels;
}

/**
 * Back / next / skip / finish controls for a tour step. The last step swaps
 * next for finish and drops skip. Steps stay in the kit.
 */
export function TourActions({
  index,
  total,
  onNext,
  onBack,
  onSkip,
  onFinish,
  labels,
}: TourActionsProps): React.ReactElement {
  const isFirst = index <= 0;
  const isLast = index >= total - 1;
  const progress = labels?.progress ?? ((i: number, n: number) => `${i} of ${n}`);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{progress(index + 1, total)}</span>
      <div className="flex flex-wrap items-center gap-2">
        {!isLast && (
          <Button type="button" variant="ghost" className="h-11 min-h-11 px-4" onClick={onSkip}>
            {labels?.skip ?? "Skip tour"}
          </Button>
        )}
        {!isFirst && (
          <Button type="button" variant="outline" className="h-11 min-h-11 px-4" onClick={onBack}>
            {labels?.back ?? "Back"}
          </Button>
        )}
        {isLast ? (
          <Button type="button" className="h-11 min-h-11 px-4" onClick={onFinish}>
            {labels?.finish ?? "Done"}
          </Button>
        ) : (
          <Button type="button" className="h-11 min-h-11 px-4" onClick={onNext}>
            {labels?.next ?? "Next"}
          </Button>
        )}
      </div>
    </div>
  );
}
