import * as React from "react";
import { cn } from "./lib/utils";

export interface ElevatedCardProps
  extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "li";
  className?: string;
  children: React.ReactNode;
}

// The polished-card look shared across profile/dashboard/setup pages across
// every kit: rounded corners and a soft lifted shadow, both from standard utilities. Deliberately
// not qkit's scalloped Ticket theme, which stays local to qkit.
export function ElevatedCard({
  as: As = "div",
  className,
  children,
  ...props
}: ElevatedCardProps): React.ReactElement {
  return (
    <As
      className={cn(
        "rounded-2xl border bg-card shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </As>
  );
}
