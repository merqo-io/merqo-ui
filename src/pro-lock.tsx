import * as React from "react";
import { Lock } from "lucide-react";

import { DefaultAppLink, type AppLinkComponent } from "./app-link";
import { cn } from "./lib/utils";

export interface ProLockProps {
  /** Copy naming the gated feature and the tier that unlocks it. */
  label: string;
  /** The plan or upgrade page. */
  href: string;
  /** For analytics, e.g. logging which gate was clicked. */
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Pass `next/link`'s `Link` to keep client-side navigation. */
  LinkComponent?: AppLinkComponent;
  className?: string;
}

/**
 * Inline pill that points a vendor on a lower tier at the plan page from the
 * spot where they hit a paid-only limit. Tier names live in `label`.
 */
export function ProLock({
  label,
  href,
  onClick,
  LinkComponent = DefaultAppLink,
  className,
}: ProLockProps): React.ReactElement {
  return (
    <LinkComponent
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10",
        className,
      )}
    >
      <Lock aria-hidden="true" className="size-3" />
      {label}
    </LinkComponent>
  );
}
