import * as React from "react";
import { cn } from "./lib/utils";

export interface DataCollectionNoticeProps {
  /** Short verb phrase finishing "We use your phone number and name to …". */
  purpose: string;
  /** Set when the form's phone field is optional, so the line does not
   *  claim a phone number the customer may not have given. */
  phoneOptional?: boolean;
  basePath?: string;
  className?: string;
}

/** PDPA Notification Obligation: tell the customer why their phone number
 *  and name are collected, at the point they type them in. Display only —
 *  no consent record is kept. */
export function DataCollectionNotice({
  purpose,
  phoneOptional = false,
  basePath = "/legal",
  className,
}: DataCollectionNoticeProps) {
  const subject = phoneOptional
    ? "your name, and your phone number if you give one,"
    : "your phone number and name";
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      We use {subject} to {purpose}. See our{" "}
      <a href={`${basePath}/privacy`} target="_blank" rel="noreferrer" className="underline">
        Privacy Policy
      </a>
      .
    </p>
  );
}
