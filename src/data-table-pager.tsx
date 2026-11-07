"use client";

import * as React from "react";

import { Button } from "./ui/button";

export interface DataTablePagerLabels {
  previous?: string;
  next?: string;
  position?: (page: number, pageCount: number) => string;
}

export interface DataTablePagerProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  labels?: DataTablePagerLabels;
}

/** Previous / next controls with a "Page x of y" line, sized for a thumb. */
export function DataTablePager({
  page,
  pageCount,
  onPageChange,
  labels,
}: DataTablePagerProps): React.ReactElement {
  const previous = labels?.previous ?? "Previous page";
  const next = labels?.next ?? "Next page";
  const position = labels?.position ?? ((p: number, n: number) => `Page ${p} of ${n}`);
  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-11 min-h-11 min-w-11 px-4"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {previous}
      </Button>
      <span aria-live="polite" className="text-sm text-muted-foreground">
        {position(page, pageCount)}
      </span>
      <Button
        type="button"
        variant="outline"
        className="h-11 min-h-11 min-w-11 px-4"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {next}
      </Button>
    </nav>
  );
}

/**
 * Page state for an uncontrolled `DataTable`: pass `page` and `setPage` as
 * `pagination`. The page is clamped, so shrinking `total` never leaves the
 * table on a page that no longer exists.
 */
export function useDataTablePage(
  total: number,
  pageSize: number,
): { page: number; setPage: (page: number) => void; pageCount: number } {
  const [requested, setRequested] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requested), pageCount);
  return { page, setPage: setRequested, pageCount };
}
