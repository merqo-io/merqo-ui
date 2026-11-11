export type SharedPiece = {
  /** Stable id; also accepted in the `allow` option. */
  id: string;
  /**
   * Source of a regular expression matched against the path tail of an
   * import specifier or a file path, extension and trailing `/index` removed.
   * It is wrapped as `(?:^|/)<pattern>$`. Patterns name the kit-local folder
   * the copies live in, so a same-named module elsewhere is not flagged.
   */
  pattern: string;
  /** Import the kit should use instead, shown in the message. */
  replacement: string;
  /** Flag only an import that names one of these exports; never a file. */
  importNames?: readonly string[];
  /**
   * Marks a file that must exist (the framework requires it) but must render a
   * shared export: a file matching `pattern` is reported unless it imports one
   * of these names from `@merqo/ui`. Applies to files only, never to imports.
   */
  requiredImport?: readonly string[];
  /** Replaces the whole message when the generic one does not fit. */
  message?: string;
};

/**
 * Pieces @merqo/ui ships that each kit once copied. Anything a kit must keep
 * (wordmark text and colours, help centres, guides, per-domain badge maps,
 * FAQ content, tour steps, legal schedules, and thin wrappers around the
 * shared footer, providers, section or money helpers) is deliberately absent.
 */
export const SHARED_PIECES: readonly SharedPiece[] = [
  {
    id: "use-async-action",
    pattern: "hooks/use-async-action",
    replacement: 'import { useAsyncAction } from "@merqo/ui"',
  },
  {
    id: "tier-label",
    pattern: "lib/tier-label",
    replacement: 'import { tierLabel } from "@merqo/ui"',
  },
  {
    id: "segmented-control",
    pattern: "components/(?:.*/)?segmented-control",
    replacement: 'import { SegmentedControl } from "@merqo/ui"',
  },
  {
    id: "page-header",
    pattern: "components/(?:widgets/)?page-header",
    replacement: 'import { PageHeader } from "@merqo/ui"',
  },
  {
    id: "empty-state",
    pattern: "components/empty-state",
    replacement: 'import { EmptyState } from "@merqo/ui"',
  },
  {
    id: "mfa-form",
    pattern: "(?:app|components)/(?:.*/)?mfa-form",
    replacement: 'import { MfaForm } from "@merqo/ui"',
  },
  {
    id: "brand-icon",
    pattern: "lib/brand-icon",
    replacement: 'import { brandIcon } from "@merqo/ui"',
  },
  {
    id: "status-badge",
    pattern: "components/(?:.*/)?status-badge",
    replacement: 'import { StatusBadge } from "@merqo/ui"',
  },
  {
    id: "confirm-dialog",
    pattern: "components/(?:.*/)?confirm-dialog",
    replacement: 'import { ConfirmDialog } from "@merqo/ui"',
  },
  {
    id: "audit-log",
    pattern: "(?:app|components)/(?:.*/)?audit-log(?:-table)?",
    replacement: 'import { AuditLogTable } from "@merqo/ui"',
  },
  {
    id: "stat-tile",
    pattern: "components/(?:.*/)?stat-tile",
    replacement: 'import { StatTile } from "@merqo/ui"',
  },
  {
    id: "stat-card",
    pattern: "components/(?:dashboard/)?stat-card",
    replacement: 'import { StatCard } from "@merqo/ui"',
  },
  {
    id: "dashboard-nav",
    pattern: "(?:app|components)/(?:.*/)?dashboard-nav",
    replacement: 'import { DashboardNav } from "@merqo/ui"',
  },
  {
    id: "dashboard-tour",
    pattern: "components/(?:.*/)?dashboard-tour(?:\\.server)?",
    replacement: 'import { DashboardTour } from "@merqo/ui"',
  },
  {
    id: "elevated-card",
    pattern: "components/(?:.*/)?elevated-card",
    replacement: 'import { ElevatedCard } from "@merqo/ui"',
  },
  {
    id: "pro-lock",
    pattern: "components/(?:.*/)?pro-lock",
    replacement: 'import { ProLock } from "@merqo/ui"',
  },
  {
    id: "feedback-schema",
    pattern: "lib/feedback-schema",
    replacement: 'import { feedbackSchema } from "@merqo/ui"',
  },
  {
    id: "telegram-link",
    pattern: "lib/telegram-link",
    replacement: 'import { telegramLink, normalizeTelegramHandle } from "@merqo/ui"',
  },
  {
    id: "customer-telegram-connect",
    pattern: "(?:app|components)/(?:.*/)?telegram-connect",
    replacement: 'import { CustomerTelegramConnect } from "@merqo/ui"',
  },
  {
    id: "vendor-telegram-section",
    pattern: "(?:app|components)/(?:.*/)?vendor-telegram-(?:connect|section)",
    replacement: 'import { VendorTelegramSection } from "@merqo/ui" (pass onConnect)',
  },
  {
    id: "safe-redirect",
    pattern: "lib/safe-redirect",
    replacement: 'import { safeRedirectPath } from "@merqo/ui"',
  },
  {
    id: "theme-props",
    pattern: "lib/theme-props",
    replacement: 'import { themeProps } from "@merqo/ui/next"',
  },
  {
    id: "security-headers",
    pattern: "lib/security-headers",
    replacement: 'import { buildSecurityHeaders } from "@merqo/ui/security"',
  },
  {
    id: "supabase-client",
    pattern: "lib/supabase/client",
    replacement: 'import { createSupabaseBrowserClient } from "@merqo/ui/supabase"',
  },
  {
    id: "supabase-server",
    pattern: "lib/supabase/server",
    replacement:
      'import { createSupabaseServerClient, createSupabaseServiceClient } from "@merqo/ui/supabase/server"',
  },
  {
    id: "supabase-middleware",
    pattern: "lib/supabase/middleware",
    replacement: 'import { updateSupabaseSession } from "@merqo/ui/supabase/middleware"',
  },
  {
    id: "rate-limit",
    pattern: "lib/rate-limit",
    replacement: 'import { rateLimit, rateLimitStrict, clientIp } from "@merqo/ui/kit-api"',
  },
  {
    id: "action-result",
    pattern: "lib/action-result",
    replacement: 'import { type ActionResult, isActionError } from "@merqo/ui/kit-api"',
  },
  {
    id: "kit-callback",
    pattern: "lib/kit-callback",
    replacement: 'import { postKitCallback } from "@merqo/ui/kit-api"',
  },
  {
    id: "kit-auth",
    pattern: "lib/kit-auth",
    replacement: 'import { verifyKitAuth, hashApiKey } from "@merqo/ui/kit-api"',
  },
  {
    id: "merqo-url",
    pattern: "lib/merqo-url",
    replacement: 'import { merqoBaseUrl, merqoUrl } from "@merqo/ui/kit-api"',
  },
  {
    id: "legal-gate",
    pattern: "lib/legal-gate",
    replacement: 'import { checkLegalAcceptance } from "@merqo/ui/auth"',
  },
  {
    id: "ui-primitive",
    pattern:
      "(?:components/)?ui/(?:badge|button|card|checkbox|dialog|input|label|select|switch|tabs|textarea|tooltip)",
    replacement: 'import the same name from "@merqo/ui/primitives"',
  },
  {
    id: "cn",
    pattern: "lib/utils",
    replacement: 'import { cn } from "@merqo/ui/primitives"',
    importNames: ["cn"],
    message:
      "Import cn from @merqo/ui/primitives and keep the other helpers local, or add it to `allow` if it wraps the shared piece.",
  },
  {
    id: "alert-dialog",
    pattern: "(?:components/)?ui/alert-dialog",
    replacement: 'import { AlertDialog } from "@merqo/ui/primitives"',
  },
  {
    id: "popover",
    pattern: "(?:components/)?ui/popover",
    replacement: 'import { Popover } from "@merqo/ui/primitives"',
  },
  {
    id: "sheet",
    pattern: "(?:components/)?ui/sheet",
    replacement: 'import { Sheet } from "@merqo/ui/primitives"',
  },
  {
    id: "dropdown-menu",
    pattern: "(?:components/)?ui/dropdown-menu",
    replacement: 'import { DropdownMenu } from "@merqo/ui/primitives"',
  },
  {
    id: "toggle",
    pattern: "(?:components/)?ui/toggle",
    replacement: 'import { Toggle } from "@merqo/ui/primitives"',
  },
  {
    id: "toggle-group",
    pattern: "(?:components/)?ui/toggle-group",
    replacement: 'import { ToggleGroup } from "@merqo/ui/primitives"',
  },
  {
    id: "skeleton",
    pattern: "(?:components/)?ui/skeleton",
    replacement: 'import { Skeleton } from "@merqo/ui/primitives"',
  },
  {
    id: "form-classes",
    pattern: "lib/utils",
    replacement: 'import { FORM_LABEL_CLASS, FORM_ERROR_CLASS } from "@merqo/ui"',
    importNames: ["FORM_LABEL_CLASS", "FORM_ERROR_CLASS"],
  },
  {
    id: "error-page",
    pattern: "app/(?!dev/)(?:.*/)?error",
    replacement: 'import { ErrorPage } from "@merqo/ui"',
    requiredImport: ["ErrorPage"],
    message:
      "Next.js needs this file, but it must render ErrorPage from @merqo/ui, or add it to `allow` if it needs custom behaviour.",
  },
  {
    id: "global-error-page",
    pattern: "app/(?!dev/)(?:.*/)?global-error",
    replacement: 'import { GlobalError } from "@merqo/ui"',
    requiredImport: ["GlobalError"],
    message:
      "Next.js needs this file, but it must render GlobalError from @merqo/ui, or add it to `allow` if it needs custom behaviour.",
  },
  {
    id: "not-found-page",
    pattern: "app/(?!dev/)(?:.*/)?not-found",
    replacement: 'import { NotFound } from "@merqo/ui"',
    requiredImport: ["NotFound"],
    message:
      "Next.js needs this file, but it must render NotFound from @merqo/ui, or add it to `allow` if it needs custom behaviour.",
  },
];
