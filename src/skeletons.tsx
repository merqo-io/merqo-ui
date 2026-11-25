import * as React from "react";
import { cn } from "./lib/utils";
import { ElevatedCard } from "./elevated-card";
import { Skeleton } from "./ui/skeleton";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia } from "./ui/item";

// Fixed width steps so rows look like content without Math.random, which would
// differ between the server and client render and break hydration.
const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-3/5"] as const;
const widthAt = (i: number) => WIDTHS[i % WIDTHS.length];

interface SkeletonBaseProps {
  className?: string;
  /** Read by screen readers only, never drawn. Pass a translated string if the page is not English. */
  label?: string;
}

function Label({ children }: { children: string }) {
  return <span className="sr-only">{children}</span>;
}

export interface DataTableSkeletonProps extends SkeletonBaseProps {
  /** Body rows. Defaults to 5. */
  rows?: number;
  /** Columns in the header and every row. Defaults to 4. */
  columns?: number;
  /** Draws the header row. Defaults to true. */
  header?: boolean;
}

/**
 * The loading shape of `DataTable`: same cell padding, row height and borders,
 * so the table does not jump when rows arrive. The layout is fixed, so cells
 * share the width and cannot push the page wider than a 360px phone.
 */
export function DataTableSkeleton({
  rows = 5,
  columns = 4,
  header = true,
  label = "Loading",
  className,
}: DataTableSkeletonProps) {
  const cols = Array.from({ length: Math.max(1, Math.floor(columns)) }, (_, i) => i);
  const body = Array.from({ length: Math.max(0, Math.floor(rows)) }, (_, i) => i);
  return (
    <div role="status" aria-busy="true" className={cn("relative w-full", className)}>
      <Label>{label}</Label>
      <table aria-hidden="true" className="w-full table-fixed caption-bottom text-sm">
        {header ? (
          <thead className="[&_tr]:border-b">
            <tr className="border-b">
              {cols.map((c) => (
                <th key={c} className="h-10 px-2 text-left align-middle">
                  <Skeleton className="h-3 w-2/3" />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody className="[&_tr:last-child]:border-0">
          {body.map((r) => (
            <tr key={r} className="border-b">
              {cols.map((c) => (
                <td key={c} className="p-2 align-middle">
                  <Skeleton className={cn("h-5", widthAt(r + c))} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface StatTileSkeletonProps extends SkeletonBaseProps {
  /** Draws the `ElevatedCard` surface, like `StatTile card`. Defaults to true. */
  card?: boolean;
}

/** The loading shape of `StatTile`: a label line, a large value line and a caption line. */
export function StatTileSkeleton({ card = true, label = "Loading", className }: StatTileSkeletonProps) {
  const Root = card ? ElevatedCard : "div";
  return (
    <Root
      role="status"
      aria-busy="true"
      className={cn("flex flex-col gap-2", card && "p-4", className)}
    >
      <Label>{label}</Label>
      <Skeleton aria-hidden="true" className="h-3 w-1/3" />
      <Skeleton aria-hidden="true" className="h-6 w-1/2" />
      <Skeleton aria-hidden="true" className="h-3 w-2/3" />
    </Root>
  );
}

export interface ListSkeletonProps extends SkeletonBaseProps {
  /** Rows. Defaults to 3. */
  rows?: number;
  /** Draws a square at the start of each row, for lists with an icon or thumbnail. */
  media?: boolean;
  /** Draws a trailing block in each row, for lists with a button or badge. */
  actions?: boolean;
}

/** The loading shape of a list of `Item` rows: optional media, a title and description line, optional actions. */
export function ListSkeleton({
  rows = 3,
  media = false,
  actions = false,
  label = "Loading",
  className,
}: ListSkeletonProps) {
  const items = Array.from({ length: Math.max(0, Math.floor(rows)) }, (_, i) => i);
  return (
    <ItemGroup role="status" aria-busy="true" className={className}>
      <Label>{label}</Label>
      {items.map((i) => (
        <Item key={i} aria-hidden="true">
          {media ? (
            <ItemMedia>
              <Skeleton className="size-10" />
            </ItemMedia>
          ) : null}
          <ItemContent>
            <Skeleton className={cn("h-4", widthAt(i))} />
            <Skeleton className={cn("h-3", widthAt(i + 2))} />
          </ItemContent>
          {actions ? (
            <ItemActions>
              <Skeleton className="h-8 w-16" />
            </ItemActions>
          ) : null}
        </Item>
      ))}
    </ItemGroup>
  );
}
