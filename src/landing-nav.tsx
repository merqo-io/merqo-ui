"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

export type LandingNavLink = { label: string; href: string };

export type LandingNavProps = {
  wordmark: React.ReactNode;
  end: React.ReactNode;
  /**
   * Secondary links (FAQ, About). Plain data so Server Components can pass
   * them. Inline from `sm` up; below `sm` they collapse into a burger menu
   * next to `end`.
   */
  links?: LandingNavLink[];
};

const MOBILE_PANEL_ID = "landing-nav-mobile-panel";

// Shell plus the shared phone pattern: each kit owns its wordmark markup and
// `end` content (auth CTAs), which legitimately differ per kit, while the
// secondary-link burger is built once so every landing header behaves the
// same on phones. Sticky position, z-index, background opacity and where
// padding lives (inner max-w-6xl box, so the nav edge matches content in the
// same `mx-auto max-w-6xl px-5` container) are fixed here to prevent drift.
export function LandingNav({ wordmark, end, links }: LandingNavProps) {
  const [open, setOpen] = React.useState(false);
  const burgerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      burgerRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const navLinks = links !== undefined && links.length > 0 ? links : null;

  return (
    // Same sticky-header shape as DashboardNav (border/bg/blur/z-index), but
    // `py-4` (vs `py-3.5`) and `max-w-6xl` (vs `max-w-7xl`) are a deliberate
    // per-surface difference: public pages have narrower content columns.
    <header className="border-border bg-background/85 sticky top-0 z-20 border-b py-4 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5">
        {wordmark}
        <div className="flex items-center gap-2 sm:gap-4">
          {navLinks ? (
            <>
              <div className="hidden items-center gap-1 sm:flex">
                {navLinks.map((link) => (
                  <Button key={link.href} asChild variant="ghost" size="sm" className="rounded-lg">
                    <a href={link.href}>{link.label}</a>
                  </Button>
                ))}
              </div>
              <button
                ref={burgerRef}
                type="button"
                aria-label="Menu"
                aria-expanded={open}
                aria-controls={MOBILE_PANEL_ID}
                className="focus-visible:ring-ring/50 hover:bg-secondary inline-flex h-11 min-w-11 items-center justify-center rounded-lg outline-none focus-visible:ring-2 motion-reduce:transition-none motion-safe:transition-colors sm:hidden"
                onClick={() => setOpen((value) => !value)}
              >
                <Menu className="size-5" />
              </button>
            </>
          ) : null}
          {end}
        </div>
      </nav>
      {navLinks && open ? (
        <>
          {/* Tap-away scrim, out of the tab order: Escape and the panel's own
              links are the keyboard ways to dismiss it. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            className="bg-foreground/20 fixed inset-0 z-10 cursor-default sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            id={MOBILE_PANEL_ID}
            role="group"
            aria-label="Menu"
            className="border-border bg-background absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b p-3 sm:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground hover:bg-secondary flex min-h-11 items-center rounded-lg px-3 text-sm font-medium motion-reduce:transition-none motion-safe:transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </>
      ) : null}
    </header>
  );
}
