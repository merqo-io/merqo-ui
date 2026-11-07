import * as React from "react";

import { cn } from "./lib/utils";

export interface CustomerTelegramConnectProps {
  /** The bot deep link. Minting it is the kit's job; `null` renders nothing. */
  deepLink: string | null | undefined;
  linkLabel: React.ReactNode;
  /** One-line preview of what connecting means. Full consent copy stays with the bot owner. */
  disclosure?: React.ReactNode;
  className?: string;
}

// The link is minted by another service, so a scheme such as javascript: must
// never reach an href.
function isSafeDeepLink(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "tg:";
  } catch {
    return false;
  }
}

/**
 * Order-page prompt that opens a Telegram bot via a deep link. Renders
 * nothing when the link could not be minted, so an outage upstream never
 * breaks the page it sits on.
 */
export function CustomerTelegramConnect({
  deepLink,
  linkLabel,
  disclosure,
  className,
}: CustomerTelegramConnectProps): React.ReactElement | null {
  if (!isSafeDeepLink(deepLink)) return null;
  return (
    <div className={cn("text-center", className)}>
      <a
        href={deepLink}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {linkLabel}
      </a>
      {disclosure && <p className="mt-1 text-xs text-muted-foreground">{disclosure}</p>}
    </div>
  );
}
