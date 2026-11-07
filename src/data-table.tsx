import * as React from "react";
import { DataTablePager, type DataTablePagerProps } from "./data-table-pager";
import { cn } from "./lib/utils";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Applied to both the header cell and every body cell in this column (e.g. "text-right" for a numeric column). */
  className?: string;
}

export interface DataTablePagination extends Pick<DataTablePagerProps, "onPageChange" | "labels"> {
  /** 1-based; clamped to the last page. */
  page: number;
  pageSize: number;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  /** Shown instead of the table when `rows` is empty. Text or any node. */
  emptyState?: React.ReactNode;
  /** Shows one page of `rows` with previous / next controls. Omit to show every row. */
  pagination?: DataTablePagination;
}

/**
 * The rows-of-columns list shell shared across every kit's transaction/
 * booking/job-history tables — self-contained (plain `<table>` + Tailwind,
 * not a wrapper over each consumer's own shadcn `Table`) so it carries no
 * cross-package import-path dependency, same reasoning as `AuditLogTable`.
 * Classes mirror shadcn/ui's own `Table` primitives so a migrated table is
 * visually identical to today's. `columns` is caller-supplied (same
 * "caller supplies the shape" contract as `AuditLogTable`/`StatusBadge`) —
 * this component owns only the table shell, never the domain columns.
 */
export function DataTable<T>({ rows, columns, getRowKey, emptyState, pagination }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyState ?? "No data yet."}</div>;
  }

  // The pager lives in its own client module and is mounted only when the
  // caller paginates, so a table without `pagination` stays usable from a
  // Server Component.
  const pageCount = pagination ? Math.max(1, Math.ceil(rows.length / pagination.pageSize)) : 1;
  const page = pagination ? Math.min(Math.max(1, pagination.page), pageCount) : 1;
  const visible = pagination ? rows.slice((page - 1) * pagination.pageSize, page * pagination.pageSize) : rows;

  return (
    <div>
    <div className="relative w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.header}
                className={cn("h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {visible.map((row) => (
            <tr key={getRowKey(row)} className="border-b transition-colors hover:bg-muted/50">
              {columns.map((col) => (
                <td key={col.header} className={cn("p-2 align-middle whitespace-nowrap", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {pagination && pageCount > 1 && (
      <DataTablePager
        page={page}
        pageCount={pageCount}
        onPageChange={pagination.onPageChange}
        labels={pagination.labels}
      />
    )}
    </div>
  );
}
