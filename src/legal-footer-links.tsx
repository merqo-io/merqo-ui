import * as React from "react";
import { cn } from "./lib/utils";

// Standalone use (e.g. AuthShell footer) has no Footer wrapper to supply the touch
// target, so each link carries its own 44px hit area.
const LINK_CLASS =
  "inline-flex min-h-11 items-center hover:text-foreground active:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export interface LegalFooterLinksProps {
  basePath?: string;
  className?: string;
}

export function LegalFooterLinks({ basePath = "/legal", className }: LegalFooterLinksProps) {
  return (
    <nav className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      <a href={`${basePath}/terms`} className={LINK_CLASS}>
        Terms
      </a>
      <a href={`${basePath}/privacy`} className={LINK_CLASS}>
        Privacy
      </a>
    </nav>
  );
}
