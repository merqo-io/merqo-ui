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
  /**
   * Adds a FAQ link after About. Opt-in because not every kit has a FAQ page
   * (printkit has none), and all kits render this footer on public pages and
   * inside dashboards. Kits with a `/faq` page pass `"/faq"`.
   */
  faqHref?: string;
  /**
   * `"compact"` is a single ~64px row (brand, links, copyright) that wraps to
   * two short rows under sm. Opt-in; the default keeps the original layout.
   */
  layout?: "compact";
}

// Under sm the footer collapses to three left-aligned rows (brand, links, copyright)
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
// (wordmark, tagline, copyright, About, optional FAQ, legal links, sign-in) without it
// ever being one component. About/FAQ/sign-in use a plain `<a>`, same as the
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
  faqHref,
  layout,
}: FooterProps): React.ReactElement {
  const compact = layout === "compact";
  // Compact keeps the wrapper groups at every width and lets flex-wrap do the
  // phone fold: brand and copyright share row one, the links take row two.
  const wrapClass = compact
    ? "mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-1 px-5 py-2 max-sm:pb-14 sm:pr-20 text-sm text-muted-foreground"
    : "mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 pt-5 pb-20 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3 sm:pt-6";
  const brandClass = compact
    ? "order-1 flex flex-wrap items-center gap-x-2"
    : "order-1 flex flex-wrap items-center gap-x-2 sm:contents";
  const copyClass = compact
    ? "order-2 text-xs sm:order-3"
    : "order-3 text-xs sm:order-none";
  const linksClass = compact
    ? "order-3 flex basis-full flex-wrap items-center gap-x-0 sm:order-2 sm:basis-auto"
    : "order-2 flex flex-wrap items-center gap-x-0 sm:contents";
  return (
    <footer className="border-t border-border">
      {/* Default keeps pb-20 to lift the links above the fixed 48px BackToTop button (24px from the viewport edge). Compact stays ~64px tall, so it reserves the button column with sm:pr-20 and, on a phone where that column would starve the link row, lifts with max-sm:pb-14 instead. */}
      <div className={wrapClass}>
        <div className={brandClass}>
          {wordmark}
          <span>{tagline}</span>
        </div>
        <span className={copyClass}>
          {copyright ?? `© 2026 ${kitName} · a Merqo kit`}
        </span>
        <div className={linksClass}>
          <a
            href="/about"
            className={`${LINK_TAP} text-xs hover:text-foreground sm:text-sm`}
          >
            About
          </a>
          {faqHref && (
            <a
              href={faqHref}
              className={`${LINK_TAP} text-xs hover:text-foreground sm:text-sm`}
            >
              FAQ
            </a>
          )}
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
