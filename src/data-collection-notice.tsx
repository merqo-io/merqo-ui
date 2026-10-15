import * as React from "react";
import { cn } from "./lib/utils";

export interface DataCollectionNoticeProps {
  /** Short verb phrase finishing "We use your phone number and name to …". */
  purpose: string;
  basePath?: string;
  className?: string;
}

/** PDPA Notification Obligation: tell the customer why their phone number
 *  and name are collected, at the point they type them in. Display only —
 *  no consent record is kept. */
export function DataCollectionNotice({
  purpose,
  basePath = "/legal",
  className,
}: DataCollectionNoticeProps) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      We use your phone number and name to {purpose}. See our{" "}
      <a href={`${basePath}/privacy`} target="_blank" rel="noreferrer" className="underline">
        Privacy Policy
      </a>
      .
    </p>
  );
}
