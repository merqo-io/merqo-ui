import * as React from "react";
import { ElevatedCard } from "./elevated-card";
import { cn } from "./lib/utils";

export type AuthShellProps = {
  /** Kit wordmark, usually wrapped in a link home by the kit. */
  wordmark?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Legal links or terms copy rendered under the card. */
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Centred card for sign-in, MFA and reset pages. Presentational and
 * server-renderable, so it carries no client directive.
 */
export function AuthShell({
  wordmark,
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthShellProps): React.ReactElement {
  return (
    <main className={cn("flex min-h-screen items-center justify-center p-5", className)}>
      <div className="w-full max-w-md">
        {wordmark ? <div className="mb-8 text-center">{wordmark}</div> : null}
        <ElevatedCard className="px-7 pt-9 pb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
        </ElevatedCard>
        {footer ? (
          <footer className="mt-6 text-center text-xs text-muted-foreground">{footer}</footer>
        ) : null}
      </div>
    </main>
  );
}
