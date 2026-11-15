import * as React from "react";
import { LegalFooterLinks } from "./legal-footer-links";

export interface FooterProps {
  /** Already-linked wordmark element (kit-specific markup, own href/anchor
   * behavior — e.g. a same-page hash jump needs a native `<a>`, not a
   * router `Link`). */
  wordmark: React.ReactNode;
  tagline: React.ReactNode;
  /** Lowercase kit name for the copyright line, e.g. "qkit". */
  kitName: string;
  /**
   * Replaces the whole copyright line. merqo is the hub, not a kit, so it
   * renders "(c) 2026 Merqo" with no "a Merqo kit" suffix.
   */
  copyright?: React.ReactNode;
  /**
   * Hides the vendor sign-in link. stockkit renders this same footer inside
   * its authenticated dashboard, where a sign-in link is meaningless.
   */
  showSignIn?: boolean;
  /**
   * Copy for the sign-in link. merqo is the hub, where "Vendor sign in"
   * reads oddly, so it passes "Sign in ->" (with a real arrow).
   */
  signInLabel?: React.ReactNode;
}

// Under sm the footer collapses to three centred rows (brand, links, copyright)
// via order and wrapper groups; from sm up the groups are `display: contents`
// so the original single row and DOM order are untouched. min-h-6 keeps each
// phone link at the WCAG 2.2 24px target size.
const LINK_TAP = "inline-flex min-h-6 items-center sm:min-h-0";

// Shell only, same "fix drift in the shared shape" rationale as LandingNav:
// every kit's own footer had converged on the exact same layout/copy order
// (wordmark, tagline, copyright, About, legal links, sign-in) without it
// ever being one component. About/sign-in use a plain `<a>`, same as the
// composed LegalFooterLinks — a footer link is low-frequency enough that a
// full page load is an acceptable, deliberate simplification (unlike
// DashboardNav's dense nav bar, which takes a LinkComponent for this reason).
export function Footer({
  wordmark,
  tagline,
  kitName,
  copyright,
  showSignIn = true,
  signInLabel = "Vendor sign in →",
}: FooterProps): React.ReactElement {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-sm text-muted-foreground sm:flex-row sm:gap-3 sm:py-6">
        <div className="order-1 flex flex-wrap items-center justify-center gap-x-2 sm:contents">
          {wordmark}
          <span>{tagline}</span>
        </div>
        <span className="order-3 text-xs sm:order-none">
          {copyright ?? `© 2026 ${kitName} · a Merqo kit`}
        </span>
        <div className="order-2 flex flex-wrap items-center justify-center gap-x-4 sm:contents">
          <a
            href="/about"
            className={`${LINK_TAP} text-xs hover:text-foreground sm:text-sm`}
          >
            About
          </a>
          <LegalFooterLinks className="gap-4 sm:gap-3 [&_a]:inline-flex [&_a]:min-h-6 [&_a]:items-center sm:[&_a]:min-h-0" />
          {showSignIn && (
            <a
              href="/login"
              className={`${LINK_TAP} text-xs hover:text-foreground sm:text-sm`}
            >
              {signInLabel}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
