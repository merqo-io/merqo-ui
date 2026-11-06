"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "./lib/utils";

export type AdminShellLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export type AdminShellProps = {
  wordmark: React.ReactNode;
  tabs: { href: string; label: string }[];
  /** Current path; the kit passes `usePathname()` so this package needs no router. */
  pathname: string;
  /** Right side of the header, e.g. an attention bell and sign-out. */
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Pass `next/link`'s `Link` to keep client-side navigation. */
  LinkComponent?: React.ComponentType<AdminShellLinkProps>;
  children?: React.ReactNode;
  className?: string;
};

function DefaultLink(props: AdminShellLinkProps) {
  return <a {...props} />;
}

// The longest matching tab wins, so an "Overview" tab at the admin root is
// not also active on every nested page.
function activeHref(tabs: AdminShellProps["tabs"], pathname: string): string | undefined {
  let best: string | undefined;
  for (const { href } of tabs) {
    const hit = pathname === href || pathname.startsWith(href.endsWith("/") ? href : `${href}/`);
    if (hit && (best === undefined || href.length > best.length)) best = href;
  }
  return best;
}

export function AdminShell({
  wordmark,
  tabs,
  pathname,
  actions,
  backHref,
  backLabel = "Back to dashboard",
  LinkComponent,
  children,
  className,
}: AdminShellProps): React.ReactElement {
  const Link = LinkComponent ?? DefaultLink;
  const active = activeHref(tabs, pathname);

  return (
    <div className={cn("min-h-screen", className)}>
      <header className="border-border bg-background/85 sticky top-0 z-20 border-b px-5 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center">
            {wordmark}
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <nav
        aria-label="Admin sections"
        className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pt-3 pb-1"
      >
        {backHref ? (
          <Link
            href={backHref}
            className="mr-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              tab.href === active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
