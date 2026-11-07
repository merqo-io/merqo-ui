import * as React from "react";
import { ElevatedCard } from "./elevated-card";
import { cn } from "./lib/utils";

export interface StatusCardProps {
  wordmark?: React.ReactNode;
  eyebrow?: React.ReactNode;
  code?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

// Shared frame for ErrorPage and NotFound so both read as the same surface.
export function StatusCard({
  wordmark,
  eyebrow,
  code,
  title,
  description,
  children,
  className,
}: StatusCardProps): React.ReactElement {
  return (
    <main className={cn("flex min-h-screen items-center justify-center p-5", className)}>
      <div className="w-full max-w-md">
        {wordmark ? <div className="mb-8 text-center">{wordmark}</div> : null}
        <ElevatedCard className="px-7 py-10 text-center">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          {code ? <p className="mb-1 font-mono text-5xl font-bold text-primary">{code}</p> : null}
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          ) : null}
          {children ? <div className="mt-7 flex flex-col gap-2.5">{children}</div> : null}
        </ElevatedCard>
      </div>
    </main>
  );
}
