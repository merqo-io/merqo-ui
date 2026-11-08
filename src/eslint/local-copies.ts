export type SharedPiece = {
  /** Stable id; also accepted in the `allow` option. */
  id: string;
  /**
   * Source of a regular expression matched against the path tail of an
   * import specifier or a file path, extension removed. It is wrapped as
   * `(?:^|/)<pattern>$`, so a bare name never matches `admin-page-header`
   * for `page-header`.
   */
  pattern: string;
  /** Import the kit should use instead, shown in the message. */
  replacement: string;
};

/**
 * Pieces @merqo/ui ships that each kit once copied. Anything a kit must keep
 * (wordmark text and colours, help centres, guides, per-domain badge maps,
 * FAQ content, tour steps, legal schedules) is deliberately absent.
 */
export const SHARED_PIECES: readonly SharedPiece[] = [
  {
    id: "use-async-action",
    pattern: "use-async-action",
    replacement: 'import { useAsyncAction } from "@merqo/ui"',
  },
  {
    id: "tier-label",
    pattern: "tier-label",
    replacement: 'import { tierLabel } from "@merqo/ui"',
  },
  {
    id: "segmented-control",
    pattern: "segmented-control",
    replacement: 'import { SegmentedControl } from "@merqo/ui"',
  },
  {
    id: "page-header",
    pattern: "page-header",
    replacement: 'import { PageHeader } from "@merqo/ui"',
  },
  {
    id: "empty-state",
    pattern: "empty-state",
    replacement: 'import { EmptyState } from "@merqo/ui"',
  },
  {
    id: "mfa-form",
    pattern: "mfa-form",
    replacement: 'import { MfaForm } from "@merqo/ui"',
  },
  {
    id: "brand-icon",
    pattern: "brand-icon",
    replacement: 'import { brandIcon } from "@merqo/ui"',
  },
  {
    id: "status-badge",
    pattern: "status-badge",
    replacement: 'import { StatusBadge } from "@merqo/ui"',
  },
  {
    id: "confirm-dialog",
    pattern: "confirm-dialog",
    replacement: 'import { ConfirmDialog } from "@merqo/ui"',
  },
  {
    id: "audit-log",
    pattern: "audit-log(?:-table)?",
    replacement: 'import { AuditLogTable } from "@merqo/ui"',
  },
  {
    id: "stat-tile",
    pattern: "stat-tile",
    replacement: 'import { StatTile } from "@merqo/ui"',
  },
  {
    id: "stat-card",
    pattern: "stat-card",
    replacement: 'import { StatCard } from "@merqo/ui"',
  },
  {
    id: "dashboard-nav",
    pattern: "dashboard-nav",
    replacement: 'import { DashboardNav } from "@merqo/ui"',
  },
  {
    id: "dashboard-tour",
    pattern: "dashboard-tour(?:\\.server)?",
    replacement: 'import { DashboardTour } from "@merqo/ui"',
  },
  {
    id: "footer",
    pattern: "(?:site-)?footer",
    replacement: 'import { Footer } from "@merqo/ui"',
  },
  {
    id: "section",
    pattern: "components/section",
    replacement: 'import { Section } from "@merqo/ui"',
  },
  {
    id: "providers",
    pattern: "(?:components/)?(?:layout/)?providers",
    replacement: 'import { Providers } from "@merqo/ui"',
  },
  {
    id: "elevated-card",
    pattern: "elevated-card",
    replacement: 'import { ElevatedCard } from "@merqo/ui"',
  },
  {
    id: "pro-lock",
    pattern: "pro-lock",
    replacement: 'import { ProLock } from "@merqo/ui"',
  },
  {
    id: "feedback-schema",
    pattern: "feedback-schema",
    replacement: 'import { feedbackSchema } from "@merqo/ui"',
  },
  {
    id: "money",
    pattern: "lib/money",
    replacement:
      'import { formatMoney, centsToDollarString, parseDollarsToCents } from "@merqo/ui"',
  },
  {
    id: "telegram-link",
    pattern: "telegram-link",
    replacement: 'import { telegramLink, normalizeTelegramHandle } from "@merqo/ui"',
  },
  {
    id: "customer-telegram-connect",
    pattern: "telegram-connect",
    replacement: 'import { CustomerTelegramConnect } from "@merqo/ui"',
  },
  {
    id: "vendor-telegram-section",
    pattern: "vendor-telegram-(?:connect|section)",
    replacement: 'import { VendorTelegramSection } from "@merqo/ui" (pass onConnect)',
  },
  {
    id: "safe-redirect",
    pattern: "safe-redirect",
    replacement: 'import { safeRedirectPath } from "@merqo/ui"',
  },
  {
    id: "theme-props",
    pattern: "theme-props",
    replacement: 'import { themeProps } from "@merqo/ui/next"',
  },
  {
    id: "security-headers",
    pattern: "security-headers",
    replacement: 'import { buildSecurityHeaders } from "@merqo/ui/security"',
  },
  {
    id: "supabase-client",
    pattern: "lib/supabase/client",
    replacement:
      'import { createSupabaseBrowserClient } from "@merqo/ui/supabase"',
  },
  {
    id: "supabase-server",
    pattern: "lib/supabase/server",
    replacement: 'import { ... } from "@merqo/ui/supabase/server"',
  },
  {
    id: "supabase-middleware",
    pattern: "lib/supabase/middleware",
    replacement: 'import { ... } from "@merqo/ui/supabase/middleware"',
  },
  {
    id: "rate-limit",
    pattern: "rate-limit",
    replacement: 'import { rateLimit, rateLimitStrict, clientIp } from "@merqo/ui/kit-api"',
  },
  {
    id: "action-result",
    pattern: "action-result",
    replacement: 'import { type ActionResult, isActionError } from "@merqo/ui/kit-api"',
  },
  {
    id: "kit-callback",
    pattern: "kit-callback",
    replacement: 'import { postKitCallback } from "@merqo/ui/kit-api"',
  },
  {
    id: "kit-auth",
    pattern: "kit-auth",
    replacement: 'import { verifyKitAuth, hashApiKey } from "@merqo/ui/kit-api"',
  },
  {
    id: "merqo-url",
    pattern: "merqo-url",
    replacement: 'import { merqoBaseUrl, merqoUrl } from "@merqo/ui/kit-api"',
  },
  {
    id: "legal-gate",
    pattern: "legal-gate",
    replacement: 'import { checkLegalAcceptance } from "@merqo/ui/auth"',
  },
  {
    id: "ui-primitive",
    pattern:
      "components/ui/(?:badge|button|card|checkbox|dialog|input|label|select|switch|tabs|textarea|tooltip)",
    replacement: 'import { ... } from "@merqo/ui/primitives"',
  },
  {
    id: "cn",
    pattern: "lib/utils",
    replacement: 'import { cn } from "@merqo/ui/primitives"',
  },
];
