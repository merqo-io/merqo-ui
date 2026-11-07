# Changelog

## [Unreleased]

### Added

- `@merqo/ui/security`: `buildSecurityHeaders({isDev, nonce?, supabaseUrl?, vercelEnv?, themeScriptHash?})` (the CSP source lists each kit kept in `security-headers.ts`), `needsNonce(pathname, prefixes?)` with the shared `NONCE_PREFIXES`, and `THEME_SCRIPT_HASH`. `needsNonce` matches whole path segments.
- `@merqo/ui/next` (new subpath, server only): `createProxy({updateSession, noncePrefixes?, supabaseUrl?})` for each kit's `proxy.ts`, `themeProps`, `buildRobots({vercelEnv, indexable?})` and `readPublicEnv({...})`.
- `@merqo/ui/kit-api` (server only, no "use client", not re-exported from the root): shared kit plumbing, replacing copies in the kits.
- `createMerqoClient({secret, baseUrl?, timeoutMs?, development?, fetch?})` with `get(path, query?)` and `post(path, body)` for Merqo's `/api/merqo/*` routes, plus `merqoBaseUrl()`, `merqoUrl()` and `callMerqoRpc()`. Results are typed and never thrown; non-https bases and paths that leave the origin are refused; redirects are refused.
- `postKitCallback({url, secret}, body, {development?, timeoutMs?, fetch?})`: signed kit callback POST. Refuses non-https URLs (and URLs with credentials), allows `http://localhost` only with `development: true`, uses `redirect: "error"`, and never throws.
- `hashApiKey(secret)` and `verifyKitAuth(request, {store, rateLimit?})`: `Bearer <kit_slug>:<secret>` check with a constant-time hash compare. The key table and failure log are an injected `KitKeyStore`; an optional per-IP attempt limit fails closed by default.
- `rateLimit`, `rateLimitStrict`, `rateLimitCheck`, `clientIp`, `digest` and `createMemoryRateLimitStore` over an injected `RateLimitStore`, and the `ActionResult` type with `isActionError`.
- `clientIp(headers, {trustedHeaders?})` reads only the listed headers (default `x-vercel-forwarded-for`; `x-forwarded-for` uses the last hop) and no longer reads `x-real-ip` by default. `verifyKitAuth` accepts `trustedHeaders` and adds a per-slug attempt bucket (`slugLimit`) beside the per-IP one.
- `AuthShell({wordmark?, title, subtitle?, children, footer?, className?})`: the centred sign-in card shared by login, MFA and reset pages. Server-renderable.
- `LoginForm({onPasswordSignIn, onPasswordSignUp?, onGoogleSignIn?, showGoogle?, defaultMode?, onModeChange?, forgotPasswordHref?, onForgotPassword?, LinkComponent?, mapError?, initialError?})`: email and password form with an optional Google button and sign in / create account toggle. Callbacks return an error string, `{notice}` or nothing, or throw; a redirect keeps the form pending with no error flash. Without `mapError` only generic copy is shown, never a provider string. Inputs carry `name`, `aria-invalid` and `aria-describedby`; typing clears the error and overlapping taps run once. No auth library dependency.
- `MfaForm({hasFactor, onEnrol?, onVerify, onCancel?, cancelLabel?, enrolIntro?, mapError?})`: six-digit authenticator code entry with optional enrolment (QR code and manual key) and a sign-out action. Pasted codes with spaces or dashes are normalised, returned strings go through `mapError`, and the QR image renders only for `data:image/` sources.
- `AdminShell({wordmark, tabs, pathname, actions?, badge?, backHref?, backLabel?, LinkComponent?, children?})`: header with a badge (default "Admin") and a horizontally scrolling tab bar whose active tab is the longest matching prefix. No client boundary.
- `Avatar`, `AvatarIdentity` and `initials`: shared identity pieces moved out of `AccountMenu`. The name sits on the right of the avatar, hidden below `sm`; the side is not configurable.
- `AsyncSubmitButton` is now a public export.
- `FORM_LABEL_CLASS` and `FormError` (`role="alert"`, `text-destructive`).
- `StatTile` `card` prop renders the `ElevatedCard` shell.
- `AccountMenu` `tier` prop renders a `TierChip`; `tierBadge` still overrides it.
- `Section` `surface` prop: `"default"` (unchanged), `"elevated"` or `"none"`.
- Shared money helpers: `formatMoney`, `centsToDollarString`, `parseDollarsToCents`, `dollarsToCents`, `MAX_MONEY_CENTS`. Integer SGD cents shown as `S$12.50`; replaces the per-kit `formatPrice`, `formatCents` and money parsers.
- Shared SGT time helpers: `formatDate`, `formatTime`, `formatDateTime`, `formatRelativeTime`, `sgDayKey`, `startOfSgDay`, `SGT_TIME_ZONE`. All output is pinned to Asia/Singapore. Time of day is 12-hour lower-case ("1:30 pm"), unlike the kits' `toLocaleTimeString` output.
- Telegram link helpers: `normalizeTelegramHandle` (also accepts `t.me/x` and `telegram.me/x`), `telegramLink`, `isTelegramLink` (only `https://t.me/...`).
- `@merqo/ui/contracts` now exports the entitlement wire enum (`ENTITLEMENT_TIERS`, `entitlementTierSchema`, `EntitlementTier`) and `ENTITLEMENT_TIER_LABELS`.
- `@merqo/ui/supabase`, `@merqo/ui/supabase/server` and `@merqo/ui/supabase/middleware`: shared browser, server, service-role and session-refresh client factories, plus `readAllRows`, `readAllRowsResult` and `listAllUsers` with tested pagination. `@supabase/ssr` and `@supabase/supabase-js` are optional peer dependencies.
- `@merqo/ui/auth`: `handleAuthCallback` (code exchange, open-redirect-safe `next`, optional next cookie, post-sign-in hook and recovery routing) and `checkLegalAcceptance` (5-minute cache that fails open only when the cache write fails).

### Changed

- `StatCard` is deprecated in favour of `<StatTile card />` and now delegates to it.
- `HelpSheet` and `FeedbackSheet` share a private sheet shell; behaviour is unchanged.
- `useMoneyField`/`MoneyInput`, `formatCatalogPrice` and `VendorTelegramSection` now use the shared helpers. Money input parsing is stricter: exponent and hex forms such as `1e3` are rejected, and rounding uses the decimal digits (`1.005` is 101 cents).
- `formatCatalogPrice` now adds thousands separators (`S$1,600` where it used to print `S$1600`).
- `tierLabel("paid")` now returns "Pro" (was "Paid"), matching the entitlement wire enum.

## [0.42.1] - 2026-11-06

### Fixed

- v0.42.0 could not be installed from git: the `buttonVariants` declaration emit failed with TS2742 when pnpm prepared the package. It now has an explicit type.
- Radix and 
ext-themes are now peer dependencies (adix-ui ^1.4.3, 
ext-themes ^0.4.6) instead of bundled dependencies, so a kit no longer installs a second Radix copy with its own DismissableLayer stack (a shared dialog opened from a kit menu left ody with pointer-events: none). Kits must provide adix-ui themselves. All @radix-ui/react-* imports now come from the adix-ui umbrella.

## [0.42.0] - 2026-11-06

### Added

- `PageHeader({eyebrow?, title, description?, children?, action?, back?, responsive?, className, ...rest})`: eyebrow, display-font h1, muted line (`description`, or `children`), right-aligned `action` and a `back` slot above. Replaces the five kit-local copies.
- `SegmentedControl<T>({ariaLabel, options, value, onChange, size?, variant?, className?, optionClassName?})` and `SegmentedOption`: a radiogroup with roving tabindex and arrow/Home/End keys. Options may carry `disabled` and `ariaLabel`; `value` may be `null`. `variant="track"` (default) is qkit's bordered pill row, `"pill"` the bordered-button grid.
- `StatCard`: `StatTile` inside the `ElevatedCard` shell. Takes every `StatTile` prop, plus `icon`, `featured` and a card-level `className`.
- `ConfirmDialog` (backed by a new private `AlertDialog` primitive in `src/ui/`): `trigger`, `title`, `description`, `confirmLabel`, `cancelLabel?`, `pendingLabel?`, `variant?`, `onConfirm`, optional controlled `open`/`onOpenChange`. Stays open and busy while `onConfirm` runs, shows the thrown message inline and stays open on failure, closes on success. No toast dependency.
- `EmptyState({icon?, title, description?, children?, actions?, className})`.
- `TierChip({tier, className?})`: the plan badge for `AccountMenu`'s `tierBadge` slot, labelled with `tierLabel`.

### Changed

- `tierLabel` now lives in a directive-free `tier-label` module (still exported from the package root), so Server Components can call it; `TierChip` uses it.
- `FeedbackSheet` and `HelpSheet` now use `SegmentedControl variant="pill"`. `PillRadioGroup` was never exported and is removed; its tests moved to `SegmentedControl`. Rendering is unchanged.

## [0.41.0] - 2026-11-04

### Added

- `AccountMenu` `extraLink` accepts an optional `icon` component (rendered at `size-4`, like the other items) and `placement: "top"` to show the link first in the menu, above Switch products and Profile. Without them the output is unchanged.
- `tierLabel(tier)`: maps a raw plan tier (`free`, `starter`, `pro`, `qkit`; case-insensitive) to its display label, capitalising unknown values. `AccountMenu` now renders `Plan · {tierLabel(vendor.tier)}`, so kits may pass raw tiers or labels.

## [0.40.0] - 2026-11-04

### Removed

- `PlanComparisonTable` and its `PlanComparisonTableProps`, `PlanComparisonTier` and `PlanComparisonRow` types. Breaking for any consumer; plan pages should render `PricingLadder` from `fetchPlanCatalog` instead.

## [0.39.0] - 2026-11-04

### Added

- `PricingLadder`: renders a plan catalog as a ladder of plan cards with a highlighted recommended plan and a separate Event Pass section. Server-renderable; all prices come from the catalog.
- `fetchPlanCatalog(baseUrl, init?)`: fetches and validates merqo's public `/api/plans`, resolving to `null` on any failure. Also exports `formatCatalogPrice`, `planCatalogSchema` and the `PlanCatalog`, `CatalogPlan` and `EventPass` types.

### Removed

- `PricingForm` and its `PricingFormProps`, `PricingFormInitial` and `PricingFieldConfig` types. Breaking for any consumer; plan pages should render `PricingLadder` from `fetchPlanCatalog` instead.

## [0.38.0] - 2026-11-03

### Added

- `DashboardNav`: optional `collapseBelow?: "sm" | "md" | "lg" | "xl"` (default `"sm"`, unchanged behaviour) picks the breakpoint at and above which links render inline instead of in the burger menu, for consoles with many links.

## [0.37.0] - 2026-11-03

### Security

- `VendorTelegramSection`: the QR markup is rendered inside an `<img>` data URI instead of being injected into the DOM, so script or handlers in it cannot run.
- `VendorTelegramSection`: the connect deep link must be `https://t.me/...` (no userinfo or port); anything else is reported through `onError` and no link or QR is shown.
- Repo: gitleaks and `pnpm audit` workflow and Dependabot security updates. CodeQL runs through the repo's default setup.

## [0.36.0] - 2026-11-02

### Changed

- `AboutMerqo`: describes qkit as piloting with a few vendors and loopkit, paykit and stockkit as in build (built, not yet tried with vendors), instead of presenting them as existing products.

## [0.35.0] - 2026-10-24

### Added

- `@merqo/ui/eslint`: `merqoEslintPreset`, the shared lint rules for comment hygiene, code-smell limits, the colour-token ban and the em dash rule. Optional peers: `eslint`, `eslint-plugin-sonarjs`, `@eslint-community/eslint-plugin-eslint-comments`.
- `@merqo/ui/security`: `buildCsp`, `withNonceCsp`, `createNonce` and `robotsHeaderFor` for a nonce Content-Security-Policy and a non-production `noindex` header.
- `@merqo/ui/contracts`: the Zod 4 `vendorActivityPayloadSchema` with optional `incidents` and `recent`, plus `INCIDENT_KINDS`. Optional peer: `zod`.
- `@merqo/ui/testing`: `renderSmoke`, a signed-in render smoke helper for Playwright. Optional peer: `@playwright/test`.
- `ImageUploader` takes `previewAlt` for the preview image.

### Changed

- `ImageUploader` preview images now carry the alt text "Uploaded image preview" instead of an empty one.
- `DashboardNav`: the mobile tap-away scrim is a `<button>` named "Close navigation menu" (out of the tab order) instead of a clickable `div`.
- `zod` moves from `dependencies` to dev and optional peer, since only `@merqo/ui/contracts` uses it.

## [0.34.3] - 2026-10-24

### Security

- Pinned `zod` to `4.6.6` (GHSA-mrhx-c7xc-m3w5, memory exhaustion on oversized constrained collections). No code change: the library already uses the Zod 4 API.

- Dev tooling: `vitest` and `@vitest/coverage-v8` to `4.1.12` (`@vitest/mocker` GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp), `vite` pinned to `8.3.5` (GHSA-587h-7wmj-h5pm and five more), `undici` forced to `>=8.12.2` through `pnpm-workspace.yaml` overrides (via `jsdom`).

## [0.34.2] - 2026-10-18

### Fixed

- Signing out from `AccountMenu` with a server action that ends in `redirect("/login")` no longer flashes a "NEXT_REDIRECT" error under the button or calls `onError`. Next.js implements `redirect()` by throwing, and `useAsyncAction` recorded that throw as a failure. It now treats a redirect as navigation: `pending` stays true, so the item keeps reading "Signing out…", `error` stays null, and `run()` still rejects with the redirect. `FeedbackSheet`, `HelpSheet`, `PricingForm` and `VendorTelegramSection` skip `onError` for a redirect too.

### Added

- `isRedirectError(error)`: true for the error Next.js `redirect()` throws, matched by its `digest` without importing Next.js.

## [0.34.0] - 2026-10-16

### Added

- `DataCollectionNotice` takes `phoneOptional`. Set it on a form whose phone field can be left blank and the line reads "We use your name, and your phone number if you give one, to {purpose}." instead of claiming a phone number the customer may not have given. The default wording is unchanged.

## [0.33.0] - 2026-10-15

### Added

- `DataCollectionNotice`: a one-line notice to render beside a customer-facing phone and name field, stating the purpose and linking to the Privacy Policy. Display only, no consent record. Lets each kit meet the PDPA Notification Obligation with the same wording.

## [0.32.3] - 2026-10-11

### Fixed

- A long `InfoTooltip` or `Section` tooltip no longer runs off a phone screen. The default-mode tooltip had no maximum width, so its text stayed on one line (1,271px for a 229-character sentence on the merqo dashboard). It now wraps at 20rem, or at the viewport width on a narrower screen.
- Importing this package in Node no longer loads the whole Simple Icons set. `social-icons` imported three brand icons from the `@icons-pack/react-simple-icons` barrel, which re-exports about 3,400 icon modules; it now imports one file per icon. A cold import of `dist/index.js` on a slow Windows checkout drops from 15 to 22 s to about 4 s, which every kit test that imports `@merqo/ui` was paying.

## [0.32.2] - 2026-10-11

### Changed

- `InfoTooltip`, and so every `Section` title tooltip, takes taps through a transparent 44px box on touch devices. The icon is still drawn at 16px and nothing moves in the layout. The peer range for `tailwindcss` is now `^4.1.0`, for the `pointer-coarse` variant.

### Fixed

- `pnpm test:coverage` no longer times out on slow Windows checkouts: the built-exports test gives its fresh Node process 120 s instead of 30 s.

## [0.32.1] - 2026-10-10

### Fixed

- Section title tooltips, and every other InfoTooltip left on the default `trigger="hover"`, now also open on tap, so phone and tablet users can read them. Hover and keyboard focus still open them; a second tap, a tap elsewhere or Escape closes them. `trigger="tap"` is unchanged.

### Added

- Allow StatTile callers to preserve label typography and container spacing.

- Allow compatible trigger, icon and content styling when composing InfoTooltip in touch interfaces.
