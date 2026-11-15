import type { ReactNode } from "react";

import { cn } from "./lib/utils";

// A phone is a real object, so it keeps a phone's corners; a kit can override
// the radius through className.
export function PhoneFrame({
  label,
  size = "large",
  className,
  children,
}: {
  label: string;
  size?: "large" | "small";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden rounded-3xl border-2 border-foreground bg-card px-3 pb-3 pt-4",
        size === "large" ? "h-[400px] w-[232px]" : "h-[250px] w-[190px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
