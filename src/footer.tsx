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
// so the original single row and DOM order are untouched. Vendors use these
// links on phones and tablets, so every link keeps a 44px hit area at every
// width; the horizontal padding stands in for the old inter-link gap.
const LINK_FOCUS =
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
const LINK_TAP = `inline-flex min-h-11 items-center px-2 ${LINK_FOCUS}`;
const LEGAL_LINK_TAP =
  "gap-0 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:px-2 [&_a]:outline-none [&_a]:focus-visible:ring-[3px] [&_a]:focus-visible:ring-ring/50";

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
      {/* pb-20 lifts the links above the fixed 48px BackToTop button (24px from the viewport edge), so the last link is tappable at the end of the page at any width. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 pt-5 pb-20 text-sm text-muted-foreground sm:flex-row sm:gap-3 sm:pt-6">
        <div className="order-1 flex flex-wrap items-center justify-center gap-x-2 sm:contents">
          {wordmark}
          <span>{tagline}</span>
        </div>
        <span className="order-3 text-xs sm:order-none">
          {copyright ?? `© 2026 ${kitName} · a Merqo kit`}
        </span>
        <div className="order-2 flex flex-wrap items-center justify-center gap-x-0 sm:contents">
          <a
            href="/about"
            className={`${LINK_TAP} text-xs hover:text-foreground sm:text-sm`}
          >
            About
          </a>
          <LegalFooterLinks className={LEGAL_LINK_TAP} />
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
