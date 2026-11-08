# @merqo/ui

Shared structural/behavioral components for the Merqo kit family
(loopkit, merqo, paykit, qkit, stockkit, printkit). Ships **no color, font-family, or
radius values** — every component styles itself with shadcn's semantic
Tailwind classes only, so each kit's own `globals.css` token values
drive the rendered brand color automatically.

> Note: the full design rationale lives in an internal spec
> (`docs/superpowers/specs/2026-08-04-merqo-ui-structural-package-design.md`)
> in the Merqo Business workspace. It is not included in this repo and is
> not reachable from a standalone clone — this README is the
> source of truth for consumers of the package.

## Install

No npm registry — installed as a git dependency, pinned to a tag:

```json
"dependencies": {
  "@merqo/ui": "github:merqo-io/merqo-ui#v0.42.1"
}
```

### Required Tailwind setup

Tailwind v4's automatic source detection skips `node_modules` by design, so
it will **never** see this package's `bg-primary`, `text-muted-foreground`,
`flex-1`, etc. classes unless a consuming kit points it there explicitly.
Without this step, `@merqo/ui` components will render completely unstyled.

Add an `@source` directive to your kit's `globals.css`, alongside the
`@import "tailwindcss";` line, pointing at this package's built `dist/`
output:

```css
@import "tailwindcss";
@source "../../node_modules/@merqo/ui/dist";
```

Adjust the relative path to match where your `globals.css` actually lives
relative to `node_modules`.

`sheet.tsx`, `dropdown-menu.tsx`, and `tooltip.tsx` use `animate-in` /
`slide-in-from-*` / `fade-out-*` utility classes that **do not exist in
stock Tailwind v4** - they're shipped by the
[`tw-animate-css`](https://www.npmjs.com/package/tw-animate-css) package.
Install it in the consuming kit and import it alongside Tailwind in
`globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@source "../../node_modules/@merqo/ui/dist";
```

Without this, the Sheet/DropdownMenu/Tooltip open/close transitions silently
no-op (the classes just don't exist), which is easy to miss since nothing
errors - it just never animates.

### pnpm install-script allowlist

pnpm 11 blocks install scripts by default via an `allowBuilds` allowlist in
each consumer's `pnpm-workspace.yaml`. This package's `prepare` script runs
`npm run build`, which is what produces `dist/` (gitignored, not committed to
this repo). If a consuming kit's `pnpm-workspace.yaml` doesn't allowlist
`@merqo/ui`, the build gets silently blocked, the kit installs an empty
package, and you get a confusing module-resolution error instead of an
obvious build failure. Add an `allowBuilds` entry for `@merqo/ui` and
verify the built `dist/` actually appears in `node_modules/@merqo/ui/` —
this check is part of the first kit's migration onto this package.

### `next/image` remote patterns (only if you use `ImageUploader`)

`ImageUploader` never imports `next/image` — the package has no `next`
dependency, so its preview falls back to a plain `<img>`. To get real
Next.js image optimisation, pass your own renderer:

```tsx
import Image from "next/image";
import { ImageUploader } from "@merqo/ui";

<ImageUploader
  bucket="vendor-images"
  pathPrefix={vendorId}
  value={url}
  onChange={setUrl}
  onUpload={uploadToStorage}
  imageComponent={Image}
/>;
```

If you do, your kit **must** allowlist the storage host in
`next.config.ts`, or `next/image` throws at runtime the first time a vendor
uploads a photo:

```ts
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "<project-ref>.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
```

This is exactly the gap that made merqo's local copy render a raw `<img>`
behind an eslint-disable. A kit with its own wrapper (e.g. qkit's
`MediaImage`, which marks `.svg` sources `unoptimized`) passes that wrapper
as `imageComponent` instead.

### `driver.js` (only if you use `DashboardTour`)

`DashboardTour` handles `driver.js` and its base stylesheet internally —
both are imported lazily, at tour-start time, inside the component itself.
Consumers don't need to install, import, or configure either one
themselves.

The scoped popover styling (the part that actually differs per kit —
background, radius, button colors) is injected automatically at runtime
via your kit's own theme tokens (`var(--popover)`, `var(--primary)`,
etc.) — no separate stylesheet to manage for that part either.

`DashboardTour` never generates or imports tour step content — keep your
own `tour-steps.ts` exactly as it is today, and pass its array as the
`steps` prop. `steps` accepts either a plain array, or a lazy resolver
function (`() => TourStep[]`) for kits that need SSR-safe mobile-vs-desktop
splitting — the resolver is called only at tour-start time, matching how
the kits currently resolve `isMobile` via `window.matchMedia`.

### Private repo auth for CI / deploys

This repo is currently **private**. A local `pnpm install` works because it
reuses your local SSH/HTTPS git credentials, but that doesn't carry over to
GitHub Actions or Vercel — those need their own authenticated access (a
GitHub App install or a scoped PAT) to fetch a git-tag dependency against a
private repo. Set this up before wiring any kit's CI or deploy pipeline to
install `@merqo/ui`, or the install step will fail there even though it
works locally.

## Components

- `InfoTooltip` — icon + hover/tap help with optional `triggerClassName`, `iconClassName`, and `contentClassName` overrides for compatible touch sizing and presentation. Parameterized `aria-label` (defaults
  to `"More info"`). `trigger?: "hover" | "tap"` (default `"hover"`). The
  default is a `Tooltip` that opens on hover, on keyboard focus and on tap, so
  it is reachable on phones and tablets: a second tap on the icon, a tap
  elsewhere or Escape closes it. Its content wraps at 20rem, or at the
  viewport width on a narrower screen; pass a `max-w-*` class in
  `contentClassName` to change that. `"tap"` switches to a click-only `Popover`,
  for longer content that should stay open until dismissed. In both modes the
  icon is drawn at 16px and, on a touch device (`pointer: coarse`), takes taps
  through a transparent 44px box centred on it, so nothing moves in the layout.
  That box reaches 14px past each edge of the icon: leave that much room, or
  size the trigger with `triggerClassName`, where it sits against another
  control. Needs Tailwind 4.1 or later for the `pointer-coarse` variant.
- `useAsyncAction` — pending-state hook that always resets, even on throw.
  Ships a companion `navigatingAway(): Promise<never>` — `await` it at the
  end of a success-and-navigate branch to keep `pending` true through the
  route transition instead of the button re-enabling mid-navigation.
  An action that throws a Next.js `redirect()` is treated the same way:
  `pending` stays true, `error` stays null and `run()` still rejects with
  the redirect, so a server action that ends in `redirect("/login")` never
  shows as a failure. Every component here that takes `onError` skips it
  for a redirect (since v0.34.2).
- `isRedirectError(error)` — true when `error` is the one Next.js
  `redirect()` throws (a string `digest` starting `NEXT_REDIRECT;`).
  Matches by digest, so it imports nothing from Next.js. `notFound()` and
  the other HTTP fallbacks are not redirects and return false. Plain
  function, no React.
- `TwoColumnSections` — the profile/settings two-column flex-stack layout
  (never a CSS grid — see the component's test file for why).
- `Section` — visually-neutral field-group shell. `icon: ReactNode` (an
  already-rendered element, e.g. `<Store className="size-5" />`, not a
  component reference), optional `eyebrow?: string`, title, optional
  `description?: string`, optional `tooltip?: ReactNode` (rich content, not
  just a string), shown behind an info icon beside the title that opens on
  hover, keyboard focus and tap. Kit-specific skins (e.g. a paper texture) layer on top via
  `className`, not baked into the component. Optional `wrapper?: (content:
ReactNode) => ReactNode` overrides the default `<section>` shell entirely
  (e.g. a kit's own bordered/textured card) — when set, `className` and the
  default bg-card/border/shadow classes don't apply.
  `surface?: "default" | "elevated" | "none"` picks the default shell: the existing
  bordered card, the `ElevatedCard` look, or no chrome (ignored with `wrapper`).
- `FeedbackSheet` / `HelpSheet` — drawer-based feedback and support forms.
  `HelpSheet` supports a plain `mailto:` mode for kits with no
  ticket-queue infra yet, or a real form mode. `FeedbackSheet` takes an
  optional `showNps?: boolean` to add a 0-10 recommend-score grid above the
  message field (score becomes required, message becomes optional).
  `HelpSheet`'s form mode takes an optional
  `categories?: {value, label}[]` to add a category radiogroup above the
  message field (an empty array behaves like no categories at all). Both
  take optional `title?`/`description?` overrides (each kit's own copy) —
  omit either for this package's own defaults. Both pill grids share an
  shared `SegmentedControl` (`variant="pill"`) implementing the full WAI-ARIA "radio group"
  keyboard pattern — only the checked pill (or the first, before anything's
  checked) is a Tab stop; Left/Right/Up/Down move focus and selection
  between pills, wrapping at the ends, and Home/End jump to the first/last
  pill.
- `tierLabel(tier)` — maps a raw plan tier (`free`, `starter`, `pro`, `qkit`;
  case-insensitive) to its display label ("Free", "Starter", "Pro", "Pro");
  other values are capitalised. `AccountMenu` applies it to `vendor.tier`.
  `AccountMenu`'s `extraLink` also takes an optional `icon` component
  (rendered at `size-4`) and `placement: "top"` to list it first.
- `AccountMenu` — the avatar dropdown alone (Profile, optional kit-local
  settings, optional Plan, Get help, Feedback, Sign out — always last,
  separated, destructive-styled). Reusable without the full nav shell. The
  trigger renders the cross-kit default avatar shape — a rounded-md ring
  avatar (image when `avatarUrl` is set, otherwise a 2-letter initials
  fallback) — no per-kit override needed. Takes an optional
  `extraLink?: {href, label}` for a kit-specific menu
  item, and forwards `showNps` to its internal `FeedbackSheet` and
  `getHelp.categories` (when `getHelp.type === "form"`) to its internal
  `HelpSheet`. `vendor.subtitle?: string` (e.g. the signed-in email) shows
  next to the trigger avatar and as a header line above Profile — omit it
  for no identity text anywhere, matching pre-`subtitle` behavior. Optional
  `tierBadge?: ReactNode` renders next to the vendor name in the dropdown
  header (only when `vendor.subtitle` is also set). The trigger always
  carries `data-tour="nav-account"` for `DashboardTour` step targeting.
  Optional `LinkComponent?: React.ComponentType<{href: string, ...}>` (since
  v0.10.0) renders Profile/Settings/Plan/help-submenu-items/`extraLink`
  through it instead of a plain `<a>` — pass `next/link`'s `Link` in a
  Next.js kit to avoid a full page reload on click, which can abort any
  in-flight fire-and-forget write (e.g. a "mark seen" call) started just
  before the click. Defaults to a plain `<a>` so the package stays
  framework-agnostic. The `mailto:` "Get help" item is always a plain
  `<a>` regardless — it never navigates the page, so there's nothing to fix.
  Since v0.18.0, a Light/Dark/System theme control (`next-themes`' own
  `useTheme`) sits above Sign out, replacing any kit-local theme toggle —
  the one home for theme switching across the whole kit family. Since
  v0.19.0 it's a `DropdownMenuSub` (trigger reads "Theme · {current}"),
  matching the "Switch products"/"Get help" submenu pattern, so the menu
  shows one row instead of three always-expanded options. Consuming apps
  must wrap their root layout in `next-themes`' own
  `<ThemeProvider attribute="class">` — without it, `useTheme()` still
  renders safely (no crash), but `setTheme` is a no-op and the control does
  nothing.
- `DashboardNav` — the full sticky-topbar shell (burger-left/avatar-right
  at every viewport). Composes `AccountMenu`, forwarding its own
  `LinkComponent` prop down to it. The burger always carries
  `data-tour="nav-menu"`. Optional `tourAnchor?: (href) => string` stamps
  `data-tour` on each nav link; optional `isActiveHref?: (href) => boolean`
  applies the cross-kit default active styling — a primary-tinted pill —
  and `aria-current="page"` — both injected, since this package has no
  router dependency of its own. The header's inner row is capped at
  `max-w-7xl`/centered (since v0.9.0) to match the content area every kit
  renders below it — a kit rendering wider content below the nav will look
  misaligned again unless its own `<main>` also caps at `max-w-7xl`.
  Optional `LinkComponent?: React.ComponentType<{href: string, ...}>` (since
  v0.10.0) renders each nav link (desktop and mobile) through it instead of
  a plain `<a>` — same rationale as `AccountMenu`'s prop above. The mobile
  tap-away scrim is a `tabIndex={-1}` `<button>` named "Close navigation
  menu" (since v0.35.0). Optional `collapseBelow?: "sm" | "md" | "lg" | "xl"`
  (since v0.38.0, default `"sm"`) sets the breakpoint below which links
  collapse into the burger menu.
- `LandingNav` — public-page nav shell: sticky header, shared shape
  (`z-20`, `bg-background/85`, padding on the header not the inner `<nav>`),
  `max-w-6xl` centered row. Takes only two slots — `wordmark: ReactNode`
  and `end: ReactNode` — so each kit keeps full control of its own
  wordmark markup and right-side links/CTAs (copy and hrefs are legitimate
  per-kit content, not something this package should standardize).
- `ImageUploader` — square (`thumb`) or wide (`banner`) image upload control
  with JPEG/PNG/WebP validation, a size cap, an injected browser-side resize
  step, and an injected storage write (`onUpload`) so the package stays
  backend-agnostic. `uploading` always resets — success, validation failure,
  or throw. Default `variant` is `"thumb"` — qkit's booth-banner usage
  **must** pass `variant="banner"` explicitly when migrating, or it will
  silently render as a small square with the wrong resize target. The
  preview `<img>` takes `previewAlt` (default "Uploaded image preview",
  since v0.35.0).
- `DashboardTour` — wires up `driver.js` (config, lifecycle, floating
  replay button, `driver.js` + its CSS both lazily self-imported) from an
  injected `steps` array/resolver, `onFirstSeen` callback, `isHomeRoute`,
  and `navigateHome` — the tour mechanism is shared, tour content, routing,
  and "has this user seen it" persistence stay entirely kit-local. The
  replay button renders on every page (not just the tour's home route);
  replaying from elsewhere navigates home first, then auto-runs once
  landed. `onFirstSeen` fires once, immediately when an unseen user's tour
  auto-starts — never on replay, never on completion. Ships the full
  cross-kit popover CSS ruleset by default (title, description,
  progress-text, close/prev/next buttons, 4-directional arrow tinting) — a
  migrated kit can delete its own `tour.css` entirely. Popover base class is
  the generic `"tour-popover"`, not kit-specific.
- `DashboardTours` — route-matched router for kits with more than one
  dashboard page tour. Takes `tours: {id, route, steps}[]`, the caller's
  current `pathname`, `seenTourIds: string[]`, and `onFirstSeen: (tourId) =>
Promise<void>`. Picks the tour whose `route` most specifically matches
  `pathname` (longest match wins, so a nested route like
  `/dashboard/booths/abc123` still resolves to the `/dashboard/booths` tour)
  and mounts only that one via `DashboardTour` internally — a page with no
  matching tour renders nothing at all, no floating button. Each mounted
  tour always sees its own route as home (there's never a cross-page replay
  to resume, since the active tour is already the one matching the current
  route), so `DashboardTour`'s single-tour `isHomeRoute`/`navigateHome`
  cross-page-replay mechanism stays available for kits that only need one
  tour but isn't exercised here. `DashboardTour` itself is unchanged and
  still exported directly for that single-tour case.
- `VendorTelegramSection` — vendor-facing Telegram connect settings block
  (Phase A2 of the cross-kit Telegram integration design), the shared
  replacement for each kit's own now-retired per-kit vendor-alert bot's
  settings UI. `connected: false` renders a "Connect Telegram" action that
  calls the injected `onConnect` (mints a fresh deep-link token on demand,
  e.g. via a server action — no token is pre-minted on page load) and then
  shows the returned `deepLink` + `qrSvgMarkup` (the QR renders as an `<img>`
  data URI, never injected markup). `deepLink` must be an `https://t.me/...`
  URL without userinfo or a port; any other value is reported through
  `onError` and no link or QR is shown. `connected: true` shows a
  connected status and a "Disconnect" action calling the injected
  `onDisconnect`. Optional `onError?: (error: unknown) => void` and
  `sectionWrapper?` (forwarded to its internal `Section`) match the rest of
  the package's own conventions. Named apart from any kit's own
  customer-facing Telegram-connect component — this one is vendor-scoped
  and standing, never single-use.
- `fetchPlanCatalog(baseUrl, init?)` (since v0.39.0) — fetches merqo's public
  `GET {baseUrl}/api/plans` and returns a validated `PlanCatalog`
  (`{ plans: CatalogPlan[], event_pass: EventPass }`, types exported;
  `planCatalogSchema` is the zod schema, so `zod` must be installed). Prices
  are cents; `kind` and `kits` are free strings. It resolves to `null` on any
  failure (network error, timeout, non-2xx, invalid JSON, unexpected shape)
  and never throws. Defaults: `next: { revalidate: 300 }` and a 5 s abort
  signal; keys in `init` override them. `formatCatalogPrice(cents)` formats
  `1600` as `S$16`, `1333` as `S$13.33` and `15` as `15c`. No `"use client"`;
  call it from a Server Component.
- `PricingLadder` (since v0.39.0) — renders a `PlanCatalog` as a ladder of
  plan cards plus a separate Event Pass section. Server-renderable, no
  billing toggle, and every amount comes from the catalog. Props:
  `catalog` (required); `highlight?: "qkit" | "all_access"` (default
  `"qkit"`; the emphasised card carries a "Recommended" label and
  `aria-current`; falls back to the other option when absent; Starter is
  never highlighted); `slugs?: string[]` (filter, catalog order kept);
  `descriptions?: Partial<Record<string, ReactNode>>` (per-slug override;
  `starter` defaults to an identity-framed line); `renderAction?: (plan) =>
  ReactNode` (the CTA in each card); `showEventPass?: boolean` (default
  `true`). A plan with a zero monthly price shows "Free" and no annual line.
  Annual prices are plain amounts, never discounts. Replaces `PricingForm`,
  which was removed in v0.39.0.

  ```tsx
  // app/dashboard/plan/page.tsx (Server Component)
  import { fetchPlanCatalog, PricingLadder } from "@merqo/ui";

  export default async function PlanPage() {
    const catalog = await fetchPlanCatalog(process.env.MERQO_URL!);
    if (!catalog) return <p>Plans are unavailable right now. Try again soon.</p>;
    return (
      <PricingLadder
        catalog={catalog}
        slugs={["free", "starter", "qkit", "all_access"]}
        renderAction={(plan) => <ChoosePlanButton slug={plan.slug} />}
      />
    );
  }
  ```

- `AuditLogTable` — renders a list of audit/activity entries
  (`{id, actor, action, target?, detail?, createdAt}`) as a bordered
  row list: action (with `detail` as a secondary line when present),
  actor, target (an em dash when omitted), and a right-aligned
  timestamp. `actor` is expected to already be a resolved display
  string (an email, a name) — this package has no auth/DB dependency,
  so resolving an `admin_id` to a human-readable actor is the caller's
  job, same as `ImageUploader`'s injected `onUpload`. Optional
  `formatAction?: (action: string) => string` maps a raw action string
  (e.g. `"set_vendor_plan"`) to a human label — omit it to render the
  raw string as-is. Optional `dateFormatter?: (date: Date) => string`
  overrides the default `Intl.DateTimeFormat` rendering. Optional
  `emptyState?: ReactNode` replaces the default "No activity recorded
  yet." message for a zero-row list.
- `StatTile` / `DeltaPill` — the label/value/delta content shared by every
  kit's stats strip. Deliberately ships with no outer card shell (border/
  background/padding/hover treatment) — three real kit implementations were
  compared and their outer wrapping diverged too much to unify; each caller
  wraps `StatTile` in its own container. `reverse?: boolean` swaps the
  default label-above-value order for value-above-label. `valueClassName?`/
  `captionClassName?` let a caller pick mono/display/plain instead of a
  fixed font. `delta?: number | null` renders the standard `DeltaPill`;
  `deltaSlot?: ReactNode` renders arbitrary content in the same slot instead
  (a breakdown-popover trigger, an icon) — mutually exclusive with `delta`.
  `valueTrailing?: ReactNode` renders content beside the value itself, for a
  richer indicator (e.g. a 3-state trend) that doesn't fit `DeltaPill`'s
  2-state up/down contract. `DeltaPill` itself takes `size?: "xs" | "sm"`
  and `downClassName?` since real kits don't share identical pill sizing or
  down-state color — only the up-state emerald is fixed across the family.
- `StatusBadge<T>({status, config})` — the dot + uppercase-tracked
  bordered-pill status chip shared across kits. `config: Record<T,
{label, className}>` is caller-supplied (same "caller supplies the map"
  contract `AuditLogTable`'s `formatAction` established), so each kit keeps
  its own status set and colors — only the rendering shape (dot, border,
  tint, tracking) is shared. Extracted from qkit's original implementation
  over printkit's/paykit's plain shadcn `Badge` uses, since qkit's was the
  one built on real semantic status tokens rather than raw Tailwind
  literals mixed in ad hoc.
- `DataTable<T>({rows, columns, getRowKey, emptyState?})` — the
  rows-of-columns table shell shared across kits' transaction/booking/job-
  history/vendor-list tables. Self-contained plain `<table>` + Tailwind
  (not a wrapper over each consumer's own shadcn `Table`), styled to match
  shadcn/ui's own `Table` primitives exactly, so it carries no cross-
  package import-path dependency — same reasoning as `AuditLogTable`.
  `columns: DataTableColumn<T>[]` (`{header, cell, className?}`) is
  caller-supplied, so this component owns only the table shell, never the
  domain columns. Deliberately not extended to kanban/card-grid list views
  (e.g. qkit's order board) — those are a genuinely different shape.
- `BackButton({href, label, LinkComponent?})` — the "leave this page" nav
  button (real `Button` hit target, not a plain text link) used at the top
  of every kit's setup/edit sub-pages. `LinkComponent` defaults to a plain
  `<a>`, same opt-in-router-Link contract as `DashboardNav`'s own prop.
  Promoted 2026-09-16 after being found byte-identical in 2 of 4 kits and
  near-identical in the other 2 (one kit's own copy literally commented
  "Mirrors qkit's identical component").
- `PageHeader({eyebrow?, title, description?, children?, action?, back?,
  responsive?, className, ...rest})` — top of a dashboard/admin page:
  `back` slot, small-caps eyebrow, display-font h1, muted line
  (`description`, or `children` for the older call style) and a
  right-aligned `action` (below the title on a phone). `responsive` drops
  the title one size on a phone.
- `SegmentedControl<T extends string>({ariaLabel, options, value, onChange,
  size?, variant?, className?, optionClassName?})` — mutually exclusive
  options as a radiogroup (roving tabindex; arrows, Home and End; disabled
  options are skipped). `options` is `{value, label, ariaLabel?, disabled?}[]`;
  `value` may be `null`. `variant="track"` (default, `size` `sm`|`md`) is the
  bordered row with a tinted active pill; `"pill"` is a grid of bordered
  buttons (give it `className="grid-cols-11 gap-1"`). For link-based
  switches, call `router.push` from `onChange`.
- `StatCard` — `StatTile` (all its props) inside the `ElevatedCard` shell.
  Adds `icon` (label-row icon, ignored when `delta`/`deltaSlot` is set),
  `featured` (tinted card, primary value) and `className` for the card.
- `ConfirmDialog({trigger?, title, description, confirmLabel, cancelLabel?,
  pendingLabel?, variant?, onConfirm, errorMessage?, open?, onOpenChange?})`
  — confirm/cancel alert dialog. `onConfirm` may be async: the dialog stays
  open and busy until it settles, closes on success, and on a throw stays
  open with the message inline (retry allowed). A Next.js redirect error is
  treated as navigation. Callers fire their own success toast inside
  `onConfirm`.
- `EmptyState({icon?, title, description?, children?, actions?, className})`
  — dashed "nothing here yet" card with up to two actions.
- `DataTable` also takes `pagination?: {page, pageSize, onPageChange, labels?}`
  (1-based, clamped): it shows one page of `rows` with previous / next
  buttons (44px) and a "Page x of y" line, and omits the pager when
  everything fits on one page. `emptyState` accepts text or any node. Pair it
  with `useDataTablePage(total, pageSize)` from `DataTablePager`'s module
  for the page state. A table without `pagination` stays free of client
  code and can render in a Server Component.
- `DataTablePager({page, pageCount, onPageChange, labels?})` and
  `useDataTablePage(total, pageSize)` -> `{page, setPage, pageCount}`: the
  pager controls and a clamped page-state hook behind `DataTable`'s
  `pagination`. Client module.
- `Faq({items, id?, eyebrow?, title?, className?})` — accordion FAQ on
  native `<details>`, so it works by touch, keyboard and screen reader.
  `items` is `{question, answer}[]` (nodes allowed); the content stays in
  the kit. Renders nothing for an empty list. Server-safe.
- `readTourSeen(key, storage?)` and `writeTourSeen(key, storage?, now?)` —
  the tour-seen core. The kit passes the storage key; storage defaults to
  `window.localStorage`, and missing or blocked storage reads as unseen and
  never throws. Server-safe. Steps stay in the kit.
- `TourActions({index, total, onNext, onBack, onSkip, onFinish, labels?})` —
  back / next / skip controls for a tour step with a "x of y" line; the last
  step shows finish instead of next and drops skip. 44px buttons.
- `ProLock({label, href, onClick?, LinkComponent?, className?})` — inline
  lock pill that sends a vendor to the plan page from a gated feature. Tier
  names and copy come from `label`; `onClick` is the hook for logging which
  gate was clicked.
- `CustomerTelegramConnect({deepLink, linkLabel, disclosure?, className?})`
  — order-page link that opens a Telegram bot. Minting the deep link is the
  kit's job; a null `deepLink` renders nothing so an upstream outage never
  breaks the page. Server-safe.
- `feedbackSchema` and `FeedbackInput` — zod schema for vendor feedback:
  `nps` (integer 0 to 10) and optional trimmed `message` (max 2000). Shared
  by paykit, printkit, stockkit and merqo; qkit's wider schema (source,
  boothId, orderNumber, token, rating) stays local. Server-safe.
- `PageHeader` also takes `actions` (alias of `action`, which wins) and
  `back` as `{href, label}` for a plain back link with a 44px target.
- `EmptyState` also takes `primaryAction` and `secondaryAction`, rendered
  in order when `actions` is not set.
- `TierChip({tier, className?})` — plan badge for `AccountMenu`/`DashboardNav`
  `tierBadge`, labelled by `tierLabel(tier)`: muted for free, primary tint
  for starter, filled for any paid tier.
- `AccountMenu` also takes `tier?: string`, rendered as a `TierChip` in the dropdown header
  (needs `vendor.subtitle`); `tierBadge` still works and wins when both are set. The trigger
  is an `AvatarIdentity`.
- `StatTile` takes `card?: boolean` for the `ElevatedCard` shell (`className` then styles the
  card). `StatCard` is deprecated: use `<StatTile card />`; it stays as an alias that adds `icon` and `featured`.
- `Avatar({name, avatarUrl?, className?})` — photo when `avatarUrl` is set, else initials in a tinted tile.
  `initials(name)`: one word gives its first two letters, several give first and last initial, empty gives a bullet.
- `AvatarIdentity({name, avatarUrl?, label?, className?})` — avatar with the label (default `name`; `null` for none)
  on its right, hidden below `sm` and truncated. The side is fixed across kits; there is no prop to flip it.
- `AsyncSubmitButton({pending, pendingChildren?, className?, children})` — submit button with a spinner,
  `aria-busy` and disabled state while pending. Also used inside `FeedbackSheet` and `HelpSheet`.
- `FORM_LABEL_CLASS` — small-caps field label classes. `FormError({message, id?, className?})` — inline
  `role="alert"` error in `text-destructive`; renders nothing when `message` is empty.
- `ElevatedCard({as?, className, children})` — the polished lifted-shadow
  card shell used across profile/dashboard/setup pages, deliberately not
  qkit's own scalloped `Ticket` theme (that stays local to qkit). `as`
  picks `div`/`section`/`li`. Promoted 2026-09-16, same "found
  byte-identical in half the kits" basis as `BackButton`.
- `SOCIAL_LINK_FIELDS` / `SocialLinks` (from `./social-icons`) — the
  vendor social-link field list (website/instagram/facebook/tiktok) with
  real brand marks and official colors (`@icons-pack/react-simple-icons`,
  `color="default"`); `website` gets a generic `lucide-react` globe tinted
  via `currentColor` instead. `SocialLinksFields({value, onChange,
idPrefix})` is the ready-made form-field group built on it (labeled
  inputs, `idPrefix` namespaces each field's `id` when a page renders more
  than one instance). Promoted 2026-09-16 — same field list and form was
  independently duplicated in all 4 kits.
- `MoneyInput({cents, onCommit, ...inputProps})` / `useMoneyField(cents,
onCommit)` — a controlled dollar-amount `<Input>`. Reformats to the
  canonical 2-decimal string only on blur (or on an external `cents`
  change while unfocused), not on every keystroke — reformatting live
  resets the caret to the end after each key, so typing "6.50"
  left-to-right would otherwise land as "6.01". `MoneyInput` wraps the hook
  as its own component so it's always called at a real component's top
  level, safe to render from inside a `.map()`. Promoted 2026-09-16 from
  qkit, the only kit that had it — loopkit's own dollar-amount field
  (`reward_cost_cents`) hand-rolled a plain `<Input>` with manual
  cents↔dollars conversion instead.
- `qrSvg(text)` (from `./qr`) — renders `text` as an inline SVG markup
  string via the `qrcode` package, for a caller to embed with
  `dangerouslySetInnerHTML` (a Telegram deep link, a shop-join QR).
  Promoted 2026-09-16 — merqo's own copy of this exact function already
  documented itself as "same shape/library as loopkit's ... own qrSvg
  helper"; this closes that gap instead of leaving a 3rd copy to drift.
  Unrelated to `react-qr-code` (qkit's booth-QR-poster, paykit's booking-QR
  view) — a heavier React-component wrapper for a different use case
  (rendering a full poster page vs. embedding inline SVG), not yet unified.
- `Footer({wordmark, tagline, kitName})` — the public-page footer shell:
  wordmark slot, tagline, "© 2026 {kitName} · a Merqo kit", About link,
  `LegalFooterLinks`, vendor sign-in link, in that fixed order. `wordmark`
  is an already-linked element (own href/anchor behavior — e.g. a
  same-page hash jump needs a native `<a>`, not a router `Link`), same
  slot contract as `LandingNav`'s own `wordmark` prop. The About/sign-in
  links render as plain `<a>` (not a `LinkComponent` prop) — a footer link
  is low-frequency enough that a full page load is an acceptable,
  deliberate simplification, matching the `LegalFooterLinks` it's
  composed with. Promoted 2026-09-16 after 3 of 4 kits' footers were found
  structurally identical (same layout order, differing only in
  wordmark/tagline/kit-name) — see the design-critique sweep's footer-
  parity work, which made them look identical without ever actually
  sharing the component.

`Footer` also takes two optional props for the two consumers whose footer
was otherwise identical: `showSignIn?: boolean` (default `true`) hides the
vendor sign-in link, for stockkit, which renders the same footer inside its
authenticated dashboard; and `copyright?: ReactNode` replaces the whole
copyright line, for merqo, which is the hub rather than a kit and so should
not say "a Merqo kit". `signInLabel?: ReactNode` (default
`"Vendor sign in →"`) overrides that link's copy, again for merqo, where
"Vendor sign in" reads oddly on the hub's own landing page.

- `BackToTop` — fixed bottom-right back-to-top button for a long landing
  page. Appears past ~600px of scroll, scrolls smoothly unless the visitor
  prefers reduced motion. Promoted 2026-09-19; was byte-identical in qkit,
  paykit, loopkit and merqo, and differed only in comments in stockkit.
- `GoogleMark` — Google's "G" mark for the Google OAuth button on every
  kit's login page. Promoted 2026-09-19; was identical in all five.
- `safeRedirectPath(next, fallback)` — open-redirect guard. Accepts only a
  same-origin relative path, rejecting `//`, `/\` and embedded control
  characters. Plain function, no React. Promoted 2026-09-19.
- `resizeToWebp(file, maxDim, quality?)` — client-side resize + WebP
  re-encode before upload, returning `{ blob, ext, type }` and falling back
  to the original file if the browser cannot decode or encode it. Where a
  browser cannot encode WebP it re-encodes as JPEG instead (v0.31.3): per
  the canvas spec an unsupported `toBlob` type silently yields a PNG, which
  earlier versions mislabelled as `image/webp` and which is several times
  larger than a JPEG of the same photo. `type`/`ext` always describe the
  bytes actually produced. Applies
  EXIF orientation so portrait phone photos are not sideways. Browser-only
  (Canvas). Promoted 2026-09-19. Each kit keeps its own upload adapter (the
  Storage bucket and path are kit-specific); only the resize step is shared.

- `storagePathFromPublicUrl(url, bucket)` — maps a Supabase Storage public
  URL back to its object path in `bucket`, so a caller can delete an image
  it is replacing. Returns `null` for anything that is not a public URL in
  that exact bucket, most importantly an OAuth provider's avatar (a Google
  profile picture lands in the same `avatar_url` field), which must never be
  treated as ours to delete. Plain function, no React. Added v0.31.4.

- `removeStorageObjects(client, bucket, paths, {label?})`,
  `removeImagesByUrl(client, bucket, urls, {ownerFolder, label?})`,
  `replacedImageTarget({buckets, before, after, ownerFolder})` and
  `removeReplacedImage(client, {buckets, before, after, ownerFolder, label?})`:
  best-effort storage cleanup built on `storagePathFromPublicUrl`. They never
  throw and log failures. `ownerFolder` is required: pass the vendor id (essential
  when the client is service role, since no storage policy bounds it), or
  `null` only when the caller already scoped the URLs. `removeStorageObjects`
  takes raw paths and applies no ownership check. `client` is any
  object with `storage.from(bucket).remove(paths)`.

  ```ts
  await removeReplacedImage(supabase, {
    buckets: ["vendor-images", "booth-images"],
    before: previousQrUrl,
    after: savedQrUrl,
    ownerFolder: vendorId,
    label: "QR image cleanup",
  });
  ```

- `commitPendingImages(values)`, `isPendingImage(url)`,
  `PendingImageUploadError` — the save side of `ImageUploader`'s
  `deferUpload` mode. With `deferUpload`, picking an image resizes it and
  hands `onChange` a local `blob:` preview URL; nothing reaches storage.
  On submit, the form passes its image values to `commitPendingImages`,
  which uploads each pending one (to a fresh random path every call) and
  returns `{ urls, uploaded }`: the values in order with previews swapped
  for public URLs, plus the URLs it uploaded. Validate and save with
  `urls`; if the save fails, delete `uploaded` and keep the previews in
  state so a retry uploads again. If an upload itself fails it throws
  `PendingImageUploadError`, whose `uploaded` lists what did upload. Use
  `deferUpload` on every form with a Save button, so a vendor who picks an
  image and walks away leaves no orphan in storage; leave it off where
  picking is the save (profile icons). Added v0.32.0.

- `DataCollectionNotice` — one muted line for a customer-facing form that
  asks for a phone number and name: "We use your phone number and name to
  {purpose}. See our Privacy Policy." `purpose` is a short verb phrase
  (required). `phoneOptional` (default `false`, added v0.34.0) is for a form
  whose phone field can be left blank: the line then reads "We use your
  name, and your phone number if you give one, to {purpose}." `basePath`
  (default `"/legal"`) and `className` work as on
  `TermsAcceptanceCheckbox`. Render it next to the fields, before the
  submit button. Display only: it records nothing, which is enough for
  Singapore PDPA's Notification Obligation on the core service. It is not
  consent to marketing; any SMS, voice or fax marketing needs express
  consent and a Do Not Call Registry check first. Added v0.33.0.

  **Wiring.** Put it on every customer-facing form that collects a phone
  number or name from someone who is not signed in as a vendor: an order or
  checkout form, a booking or inquiry form, a waitlist or notify-me form. Vendor
  and admin forms do not need it, because the vendor accepted the terms at
  sign-up. Place it inside the form, directly above the submit button and
  below the last personal-data field, so the customer reads it at the moment
  they type. Keep `purpose` to one short phrase that says what the data is
  for, such as `process your order`, and set `phoneOptional` whenever the
  phone field can be left empty. Where the form also needs consent to the
  terms, show `TermsAcceptanceCheckbox` as well; the notice never replaces it.

  ```tsx
  import { DataCollectionNotice } from "@merqo/ui";

  <form action={placeOrder}>
    <Input name="name" autoComplete="name" required />
    <Input name="phone" type="tel" autoComplete="tel" />
    <DataCollectionNotice purpose="process your order" phoneOptional />
    <Button type="submit">Place order</Button>
  </form>
  ```

These are the first exports that are not React components. Since
v0.31.0 the package no longer applies a package-wide `"use client"` banner,
so a plain function like `safeRedirectPath` is a real value in a Server
Component rather than an opaque client-reference stub.

### Sign-in and admin chrome

These four are presentational: none imports Supabase or any auth library.
The kit passes async callbacks that return an error message (or nothing on
success) or throw. A thrown Next.js redirect, or a callback that ends with
`await navigatingAway()`, keeps the form pending with no error shown.

Security duties that stay with the kit:

- **Map errors.** Without `mapError` the forms never render a returned
  string or a thrown error's `code` or `message`, only a generic line such as
  "Could not sign in. Try again." Provider text can reveal whether an account
  exists, so the kit decides which codes get friendly copy.
- **Validate redirects.** The forms never navigate. The kit's callbacks do,
  so a `next` or `redirect` value from the URL must go through
  `safeRedirectPath` (or an equivalent same-origin check) before it reaches
  `router.push` or an OAuth `redirectTo`.
- **Render QR codes safely.** `MfaForm` shows the QR image only when
  `qr` starts with `data:image/`; anything else leaves just the manual key.

- `AuthShell({wordmark?, title, subtitle?, children, footer?, className?})` -
  centred card with a wordmark slot above, an `h1` title, optional subtitle
  and a footer slot (legal links) under the card. Server-renderable.
- `LoginForm({onPasswordSignIn, onPasswordSignUp?, onGoogleSignIn?,
  showGoogle?, defaultMode?, onModeChange?, forgotPasswordHref?,
  onForgotPassword?, LinkComponent?, mapError?, initialError?})` - email and
  password with correct `autocomplete` (`current-password` or
  `new-password`), `name` attributes, and `aria-invalid` /
  `aria-describedby` tied to the error. Typing clears the error, and
  overlapping taps run a callback once. The Google button needs
  `onGoogleSignIn` and `showGoogle` (default true). The "Create an account"
  toggle shows only with `onPasswordSignUp`; `onModeChange` lets the kit
  update the `AuthShell` title or `?mode=signup`. A callback may return
  `{notice}` instead of an error to show a status message such as "Check
  your email" (sign-up confirmation, reset link sent).
  `forgotPasswordHref` renders a link (pass `next/link`'s `Link` as
  `LinkComponent`); `onForgotPassword(email)` renders a button instead and
  asks for an email first. `mapError(raw, context)` turns a returned string,
  or a thrown error's `code` (else `message`), into vendor copy; context is
  `"signin" | "signup" | "oauth" | "reset"`. Controls are 44px or taller and
  the whole form works by touch.
- `MfaForm({hasFactor, onEnrol?, onVerify, onCancel?, cancelLabel?,
  enrolIntro?, mapError?})` - six-digit code (`inputMode="numeric"`,
  `pattern="[0-9]*"`, `autocomplete="one-time-code"`). Typed or pasted text
  is reduced to its first six digits, so "123 456" and "123-456" work. With
  `hasFactor` false it first shows "Set up authenticator"; `onEnrol` returns
  `{qr, secret, factorId?}` or an error string, and `factorId` is handed back
  as `onVerify(code, {factorId})`. `onCancel` adds a secondary button
  (default label "Sign out"). Returned strings from all three callbacks go
  through `mapError(raw)` like thrown errors. Covers the qkit, loopkit and
  merqo form and the paykit and stockkit variants, which differ only in
  radius and error copy.
- `AdminShell({wordmark, tabs, pathname, actions?, badge?, backHref?,
  backLabel?, LinkComponent?, children?})` - header with the wordmark and a
  badge (default "Admin"), then a tab bar that scrolls sideways on phones.
  The active tab is the longest `href` that is a prefix of `pathname`, so an
  Overview tab at `/admin` is not active on `/admin/vendors`. `backHref` adds
  a leading back link (stockkit). Pass `next/link`'s `Link` as
  `LinkComponent`. It needs no client boundary, so a server layout can render
  it. It does not render `DashboardNav`, which needs an account menu the admin
  header does not have; put sign-out and the like in `actions`.

Wiring example in a Next.js kit:

```tsx
// app/login/page.tsx (client component)
<AuthShell wordmark={<Wordmark />} title="Welcome back" footer={<LegalFooterLinks />}>
  <LoginForm
    onPasswordSignIn={async (c) => {
      const { error } = await supabase.auth.signInWithPassword(c);
      if (error) return friendlyAuthError(error, "signin");
      router.push("/dashboard");
      router.refresh();
      await navigatingAway();
    }}
    onGoogleSignIn={signInWithGoogle}
    forgotPasswordHref="/forgot-password"
  />
</AuthShell>

// app/admin/layout.tsx (client wrapper)
<AdminShell
  wordmark={<Wordmark />}
  tabs={[{ href: "/admin", label: "Overview" }, { href: "/admin/vendors", label: "Vendors" }]}
  pathname={usePathname()}
  LinkComponent={Link}
  actions={<SignOutButton />}
>
  {children}
</AdminShell>
```

## App chrome (error pages, icons, metadata, providers, legal pages)

Everything a kit's `app/` folder repeats: the error and 404 pages, favicon,
root metadata, theme and toast providers, the wordmark frame and the legal
pages. The package ships no colours or fonts; each kit passes its own text,
colour classes and colour values. Links use a `LinkComponent` prop (pass
`next/link`'s `Link`) so the package never imports a router.

- `ErrorPage({error, reset, wordmark?, eyebrow?, title?, description?,
  resetLabel?, actions?, onError?})` - client body for `app/error.tsx`. Logs
  the error once (`onError` replaces `console.error`), shows a full-width
  44px "Try again" button and Next's digest as a reference line. Replaces the
  qkit, paykit and stockkit pages.
- `GlobalError({reset, colors, fontFamily?, radius?, lang?, title?, description?,
  resetLabel?})` - client body for `app/global-error.tsx`; renders its own
  `html` and `body` with inline styles because the stylesheet has not loaded
  when the root layout throws. `colors` (`background`, `foreground`,
  `mutedForeground`, `primary`, `primaryForeground`) is required. Pass the
  kit's own token values (copies of its CSS variable values), not new ad-hoc
  colours. `fontFamily` and `radius` (a CSS length for the button) are
  optional and unset by default, so the kit passes its own. The content sits
  in a `main` landmark. paykit and printkit can now add the file they lack.
- `NotFound({wordmark?, code?, title?, description?, homeHref?, homeLabel?,
  action?, LinkComponent?})` - server-safe body for `app/not-found.tsx`.
  `code="404"` shows the big number (qkit, stockkit); `action` replaces the
  default link home.
- `brandIcon(size, {monogram, background, foreground, fontFamily?, radius?})` with `ICON_SIZE`
  (32) and `APPLE_ICON_SIZE` (180) - the tile for `icon.tsx` and
  `apple-icon.tsx`. Server-safe; the kit owns the `next/og` import and the
  colour values. `fontFamily` and `radius` (px number or CSS length) are
  optional and unset by default; pass a system family rather than the kit
  display font so no font data ships to the icon route.
- `kitMetadata(kitName, overrides?)` - Next `Metadata` with title
  `{default: kitName, template: "%s | kitName"}`. A string `title` override
  becomes the default title; an object `title` (`default`, `template`,
  `absolute`) is merged over those defaults; every other field is passed
  through.
- `ThemeProvider`, `Toaster` and `Providers({children, theme?, toaster?})` -
  `ThemeProvider` is next-themes preloaded with `themeProps` from
  `@merqo/ui/next`; `Toaster` is sonner (top-right, `richColors`) that follows
  the resolved theme. `Providers` is both together. Needs the `next-themes`
  and `sonner` peers; replaces stockkit's local `theme-provider`.
- `Wordmark({children, size?, href?, label?, LinkComponent?, className?})` -
  the frame only: display font, weight, tracking, a `size` of `sm`
  (`text-lg`), `md` (default, `text-xl`), `lg` or `xl` (`text-3xl`), and an
  optional link (44px tall) when `href` is set. Without `href`, `label` sets
  an `aria-label` on the plain span. The kit supplies the letters
  and any accent classes as children.
- `LegalPage({doc, kit?, wordmark?, homeHref?, LinkComponent?, className?})`
  and `legalPageMetadata(doc)` - page body and `metadata` for
  `app/legal/terms` and `app/legal/privacy`, around `LegalDocument`.
  `LegalPage` is a server component that renders the client `LegalDocument`,
  so it carries no `"use client"` itself.
- `AcceptTermsPage({action, next, wordmark?, title?, description?, basePath?,
  submitLabel?})` and `AcceptTermsForm` - client body for
  `app/legal/accept/page.tsx`: an `AuthShell` card with the
  `TermsAcceptanceCheckbox` and a submit that stays disabled until the box is
  ticked. `action` is the kit's server action and receives `FormData` with a
  `next` field; pass an already sanitised `next` (`safeRedirectPath`). The
  page must not run the kit's own legal gate.

```tsx
// app/error.tsx
"use client";
import { ErrorPage } from "@merqo/ui";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPage {...props} wordmark={<Wordmark size="lg" />} />;
}

// app/global-error.tsx
"use client";
import { GlobalError } from "@merqo/ui";
export default function Global(props: { reset: () => void }) {
  return (
    <GlobalError
      {...props}
      colors={{
        background: KIT_TOKENS.background,
        foreground: KIT_TOKENS.foreground,
        mutedForeground: KIT_TOKENS.mutedForeground,
        primary: KIT_TOKENS.primary,
        primaryForeground: KIT_TOKENS.primaryForeground,
      }}
      fontFamily="Georgia, serif"
      radius="0.5rem"
    />
  );
}

// app/not-found.tsx
import Link from "next/link";
import { NotFound } from "@merqo/ui";
export default function Page() {
  return <NotFound code="404" wordmark={<Wordmark />} LinkComponent={Link} />;
}

// app/icon.tsx (apple-icon.tsx: APPLE_ICON_SIZE and size 180)
import { ImageResponse } from "next/og";
import { brandIcon, ICON_SIZE } from "@merqo/ui";
export const size = ICON_SIZE;
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    brandIcon(size.width, {
      monogram: "Q",
      background: KIT_TOKENS.primary,
      foreground: KIT_TOKENS.primaryForeground,
      fontFamily: "Georgia, serif",
      radius: 6,
    }),
    { ...size },
  );
}

// app/layout.tsx
export const metadata = kitMetadata("qkit", { description: "Queues for events" });
// <body><Providers>{children}</Providers></body>

// components/wordmark.tsx
export const Wordmark = (p: { size?: WordmarkSize }) => (
  <MerqoWordmark {...p} href="/" LinkComponent={Link}>
    <span className="text-primary">q</span>kit
  </MerqoWordmark>
);

// app/legal/terms/page.tsx
export const metadata = legalPageMetadata("terms");
export default () => <LegalPage doc="terms" kit="qkit" wordmark={<Wordmark />} LinkComponent={Link} />;

// app/legal/accept/page.tsx
<AcceptTermsPage action={acceptLegalTerms} next={safeRedirectPath(next, "/dashboard")} wordmark={<Wordmark />} />
```

## Money, time and entitlement helpers

Pure functions with no `"use client"`, safe to import from Server Components.
Kits must use these instead of local copies.

**Enforced rules:** money is integer SGD cents shown as `S$12.50` (always an
`S$` prefix); every date and time is shown in Singapore time (`Asia/Singapore`)
whatever the server or browser zone.

- `formatMoney(cents, { trimWholeDollars? })`: `1250` -> `S$12.50`, `-5` ->
  `-S$0.05`, `0` -> `S$0.00`, large values grouped (`S$1,234,567.89`).
  `trimWholeDollars` gives `S$16` for whole amounts. Non-finite input gives `-`.
- `centsToDollarString(cents)`: `650` -> `6.50`, for input values.
- `parseDollarsToCents(input, { allowNegative? })`: accepts a string (FormData
  value, `S$`/`$` prefix and `1,234.50` grouping allowed) or a number. Returns
  `{ ok: true, cents }` (`cents` is `undefined` for blank input) or
  `{ ok: false }`. Rounds on the decimal digits, so `1.005` is 101 cents.
- `dollarsToCents(input, opts?)`: the same, collapsed to `number | null`.
- `MAX_MONEY_CENTS`: the one cap, `Number.MAX_SAFE_INTEGER` (what `MoneyInput`
  always accepted). A kit that needs a lower business limit checks it itself.
- `formatDate`, `formatTime`, `formatDateTime`, `formatRelativeTime(input, now?)`:
  `7 Nov 2026`, `1:30 am`, `7 Nov 2026, 1:30 am`, `5m ago` / `in 3h` / `just
  now`, falling back to the date after a week. Input is an ISO string, epoch
  milliseconds or a `Date`; invalid input gives `-`.
- `sgDayKey(input)` (`2026-11-07`), `startOfSgDay(input)` (the 00:00 SGT
  instant) and `SGT_TIME_ZONE`.
- `normalizeTelegramHandle`, `telegramLink(handle)`, `isTelegramLink(url)`:
  `normalizeTelegramHandle` accepts `@handle`, `handle`, `t.me/handle`,
  `telegram.me/handle` and `https://t.me/handle`; `telegramLink` only ever
  produces `https://t.me/<handle>` and `isTelegramLink` accepts only that
  host; `@` is stripped
  and the handle must be 5-32 letters, digits or underscores starting with a
  letter.
- `@merqo/ui/contracts`: `ENTITLEMENT_TIERS`, `entitlementTierSchema` (zod),
  `EntitlementTier` and `ENTITLEMENT_TIER_LABELS` for the wire enum
  `free | starter | qkit | paid`. `qkit` and `paid` both display as "Pro"
  (`tierLabel` agrees). stockkit's `free`/`pro` maps to wire `free`/`paid`.

## Shared primitives (`@merqo/ui/primitives`)

The shadcn primitives the kits used to copy locally. They carry no colour, font
or radius values, only semantic Tailwind classes, so each kit's tokens drive the
look. The subpath is a plain re-export of per-module files: `cn`, `Button`,
`Badge`, `Card` and the other directive-free modules stay importable from a
Server Component, and each client primitive keeps its own `"use client"`.

```tsx
import { Button, Dialog, DialogContent, cn } from "@merqo/ui/primitives";
```

- `cn(...classes)`: `clsx` plus `tailwind-merge`.
- `Button`, `buttonVariants`, `ButtonProps`. Variants: `default`,
  `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`
  (36px), `xs` (24px), `sm` (32px), `lg` (40px), `icon`, `icon-xs`, `icon-sm`,
  `icon-lg`. On coarse pointers (touch) every size is at least 44px (`lg` is
  48px), so a vendor on a tablet gets a full tap target; mouse and trackpad keep
  the compact sizes.
- `Input` and `Label` carry shadcn's dark-mode (`dark:bg-input/30`, dark
  invalid ring) and disabled-state classes, so `LoginForm`, `MfaForm`,
  `SocialLinksFields` and `MoneyInput` pick them up. Internal `Button`,
  `Input` and `SelectTrigger` uses such as `BackButton` grow to 44px on coarse
  pointers.
- `Input` and `SelectTrigger` are 36px (32px for `sm`) and 44px on coarse
  pointers. `Textarea` and `Label` have no size.
- `Badge`, `badgeVariants`, `BadgeProps`. Variants: `default`, `secondary`,
  `destructive`, `outline`, `ghost`, `link`, `muted`, `success`. A kit that needs a gold badge wraps
  `Badge` locally.
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`,
  `SelectItem`, `SelectLabel`, `SelectSeparator`, `SelectScrollUpButton`,
  `SelectScrollDownButton`.
- `Switch` (`size`: `default` or `sm`), `Checkbox`.
- `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`,
  `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`,
  `DialogPortal`.
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
  `CardContent`, `CardFooter`.
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`. A tooltip
  opens on hover and keyboard focus only, so never make it the sole place a
  vendor can read something on touch; use `InfoTooltip` with `trigger="tap"`.

## Shared tooling entries (since v0.35.0)

Four subpath exports with no React. Their peer dependencies are optional;
install only what the entries you import need.

- `@merqo/ui/eslint`: `merqoEslintPreset({ sonarjsPlugin, tsPlugin })`
  returns flat-config blocks: directive hygiene (`eslint-comments`,
  unused-disable errors), own-line comments, code-smell limits
  (`max-lines` 500, `complexity` 15, `max-params` 4), a ban on colour
  literals in `src/**`, and the em dash copy rule. Pass the kit's own
  plugin objects so ESLint sees one instance of each:

  ```js
  import sonarjs from "eslint-plugin-sonarjs";
  import { merqoEslintPreset } from "@merqo/ui/eslint";

  export default [
    // next config, kit ignores, kit-local rules (e.g. no-use-before-define)
    ...merqoEslintPreset({
      sonarjsPlugin: sonarjs.configs.recommended.plugins.sonarjs,
      tsPlugin: typescriptEslintPlugin,
    }),
  ];
  ```

  The preset adds no `@typescript-eslint/no-use-before-define`; kits keep
  their own. Test files, `scripts/**` and `e2e/**` are exempt from inline
  comment, size and colour rules.

  `merqoNoLocalCopies({ allow? })` is a separate flat-config helper, not part
  of the preset. It reports an import, re-export or dynamic `import()` of a
  kit-local module (`@/...`, `~/...`, `src/...` or a relative path), and any
  file that lives at such a path, when @merqo/ui ships the same piece. The
  message names the replacement import. Imports from `@merqo/ui` itself are
  never flagged. Turn it on in the pull request that deletes the copies:

  ```js
  import { merqoEslintPreset, merqoNoLocalCopies } from "@merqo/ui/eslint";

  export default [
    ...merqoEslintPreset({ sonarjsPlugin, tsPlugin }),
    ...merqoNoLocalCopies({ allow: ["components/landing/footer"] }),
  ];
  ```

  `allow` lists pieces the kit keeps on purpose, as a piece id (`"footer"`)
  or a path suffix without extension. Either form skips both the imports of
  that path and the file that lives there. Flagged pieces, with the id and
  the replacement:

  | Local module (name at the end of the path) | Id | Use instead |
  | --- | --- | --- |
  | `use-async-action` | `use-async-action` | `useAsyncAction` from `@merqo/ui` |
  | `tier-label` | `tier-label` | `tierLabel` from `@merqo/ui` |
  | `segmented-control` | `segmented-control` | `SegmentedControl` from `@merqo/ui` |
  | `page-header` | `page-header` | `PageHeader` from `@merqo/ui` |
  | `empty-state` | `empty-state` | `EmptyState` from `@merqo/ui` |
  | `mfa-form` | `mfa-form` | `MfaForm` from `@merqo/ui` |
  | `brand-icon` | `brand-icon` | `brandIcon` from `@merqo/ui` |
  | `status-badge` | `status-badge` | `StatusBadge` from `@merqo/ui` |
  | `confirm-dialog` | `confirm-dialog` | `ConfirmDialog` from `@merqo/ui` |
  | `audit-log`, `audit-log-table` | `audit-log` | `AuditLogTable` from `@merqo/ui` |
  | `stat-tile` | `stat-tile` | `StatTile` from `@merqo/ui` |
  | `stat-card` | `stat-card` | `StatCard` from `@merqo/ui` |
  | `dashboard-nav` | `dashboard-nav` | `DashboardNav` from `@merqo/ui` |
  | `dashboard-tour`, `dashboard-tour.server` | `dashboard-tour` | `DashboardTour` from `@merqo/ui` |
  | `footer`, `site-footer` | `footer` | `Footer` from `@merqo/ui` |
  | `components/section` | `section` | `Section` from `@merqo/ui` |
  | `providers`, `components/providers`, `layout/providers` | `providers` | `Providers` from `@merqo/ui` |
  | `elevated-card` | `elevated-card` | `ElevatedCard` from `@merqo/ui` |
  | `pro-lock` | `pro-lock` | `ProLock` from `@merqo/ui` |
  | `feedback-schema` | `feedback-schema` | `feedbackSchema` from `@merqo/ui` |
  | `lib/money` | `money` | `formatMoney`, `centsToDollarString`, `parseDollarsToCents` from `@merqo/ui` |
  | `telegram-link` | `telegram-link` | `telegramLink`, `normalizeTelegramHandle` from `@merqo/ui` |
  | `telegram-connect` | `customer-telegram-connect` | `CustomerTelegramConnect` from `@merqo/ui` |
  | `vendor-telegram-connect`, `vendor-telegram-section` | `vendor-telegram-section` | `VendorTelegramSection` from `@merqo/ui`, passing `onConnect` |
  | `safe-redirect` | `safe-redirect` | `safeRedirectPath` from `@merqo/ui` |
  | `theme-props` | `theme-props` | `themeProps` from `@merqo/ui/next` |
  | `security-headers` | `security-headers` | `buildSecurityHeaders` from `@merqo/ui/security` |
  | `lib/supabase/client` | `supabase-client` | `createSupabaseBrowserClient` from `@merqo/ui/supabase` |
  | `lib/supabase/server` | `supabase-server` | `@merqo/ui/supabase/server` |
  | `lib/supabase/middleware` | `supabase-middleware` | `@merqo/ui/supabase/middleware` |
  | `rate-limit` | `rate-limit` | `rateLimit`, `rateLimitStrict`, `clientIp` from `@merqo/ui/kit-api` |
  | `action-result` | `action-result` | `ActionResult`, `isActionError` from `@merqo/ui/kit-api` |
  | `kit-callback` | `kit-callback` | `postKitCallback` from `@merqo/ui/kit-api` |
  | `kit-auth` | `kit-auth` | `verifyKitAuth`, `hashApiKey` from `@merqo/ui/kit-api` |
  | `merqo-url` | `merqo-url` | `merqoBaseUrl`, `merqoUrl` from `@merqo/ui/kit-api` |
  | `legal-gate` | `legal-gate` | `checkLegalAcceptance` from `@merqo/ui/auth` |
  | `components/ui/` `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `select`, `switch`, `tabs`, `textarea`, `tooltip` | `ui-primitive` | the same names from `@merqo/ui/primitives` |
  | `lib/utils` | `cn` | `cn` from `@merqo/ui/primitives` |

  Not flagged on purpose, because they carry kit content: the wordmark,
  FAQ content, tour steps, help centres and guides, per-domain status badge
  maps (for example `order-status-badge`) and legal schedules. A wrapper that
  keeps `lib/utils` or a `lib/supabase/*` file for more than the shared
  piece belongs in `allow`.
- `@merqo/ui/security`: `buildCsp`, `withNonceCsp` (call from `proxy.ts`
  on dynamic routes), `createNonce` and `robotsHeaderFor(VERCEL_ENV)` for
  the staging `noindex` header. `style-src` keeps `'unsafe-inline'`; with no
  nonce `script-src` falls back to `'unsafe-inline'` for static routes.
- `@merqo/ui/contracts`: `vendorActivityPayloadSchema` (Zod 4),
  `vendorStatusSchema` and `INCIDENT_KINDS`. `incidents` and `recent`
  (max 10) are optional, so a kit that does not report them yet stays valid.
- `@merqo/ui/testing`: `renderSmoke(page, routes)` visits each route on a
  signed-in Playwright page and returns the failures: 5xx, error boundary
  (default selector `[data-error-boundary="true"]`), `pageerror`, or a CSP
  violation in the console. An empty array means every route rendered.
- `@merqo/ui/testing` also exports `totpCode(secret, now?)` (RFC 6238, SHA-1,
  30 s, 6 digits; throws on a non-base32 secret) and
  `createAuthenticatedGlobalSetup({stateFile, email, password, ...})`, a
  Playwright `globalSetup` that signs a seeded account in, enrols an
  authenticator through the real `/mfa` page and saves the aal2
  `storageState`. `enabled` defaults to `MERQO_E2E_AUTH === "1"`; routes,
  selectors and URL patterns are overridable and `launch` can be injected.
  `@playwright/test` stays an optional peer, loaded only when the setup runs
  and never from the package root.

  ```ts
  // e2e/global-setup.ts
  import { createAuthenticatedGlobalSetup } from "@merqo/ui/testing";

  export const TEAM_STATE = "e2e/.auth/team.json";
  export default createAuthenticatedGlobalSetup({
    stateFile: TEAM_STATE,
    email: process.env.MERQO_E2E_TEAM_EMAIL,
    password: process.env.MERQO_E2E_TEAM_PASSWORD,
  });
  ```
- `@merqo/ui/admin` (server only, no "use client", not re-exported from the
  root): `recordAudit(client, {actorId, action, targetId, detail})` appends
  to `admin_audit` and `recordOpsEvent(client, {vendorId, kind, ref, code})`
  to `ops_events` (`ref` and `code` cut to 64 characters). `client` is a
  service-role Supabase client or a (possibly async) factory for one. Neither
  ever throws; failures are logged by message or code only. The action and
  kind names are generic parameters, so each kit keeps its own union. Kit
  queries (`summarizeIncidents`, stuck-job incidents, `order_status_events`)
  stay in the kit.

  ```ts
  import { recordAudit } from "@merqo/ui/admin";
  import { createServiceClient } from "@/lib/supabase/server";

  type Action = "order.advance" | "booth.create";
  export const audit = (actorId: string, action: Action, targetId: string | null, detail: Json) =>
    recordAudit<Action>(createServiceClient, { actorId, action, targetId, detail });
  ```

## Next.js server helpers (`@merqo/ui/next`)

Server-only; it carries no `"use client"` and is not re-exported from the
package root. Replaces each kit's copies of `security-headers.ts`,
`proxy.ts` plumbing, `theme-props.ts`, `app/robots.ts` and `lib/env.ts`.

- `@merqo/ui/security` also exports `buildSecurityHeaders({ isDev, nonce?,
  supabaseUrl?, vercelEnv?, themeScriptHash? })`, which returns the
  `connectSrc`, `imgSrc`, `frameSrc` and `scriptSrc` lists to give
  `buildCsp`. It reads no environment: pass `process.env.*` literals.
  `nonce: true` adds `THEME_SCRIPT_HASH` (next-themes' inline bootstrap).
  `needsNonce(pathname, prefixes = NONCE_PREFIXES)` decides which routes
  render per request and so get a nonce; it matches whole path segments, so
  `/c` covers `/c/shop` and not `/contact`.
  It returns only the CSP source lists. HSTS, `X-Content-Type-Options:
  nosniff` and `Referrer-Policy` are not set here; they stay in each kit's
  `next.config.ts`.
- `createProxy({ updateSession, noncePrefixes?, supabaseUrl?, isDev?, vercelEnv? })`
  returns the kit's `proxy`: nonce CSP on per-request routes, static CSP
  elsewhere and in dev, `noindex` off production. Pass `noncePrefixes`
  explicitly with the kit's own per-request routes. The default
  `NONCE_PREFIXES` is the union of every kit's prefixes, so a statically
  prerendered page under a prefix the kit did not nonce before would lose its
  scripts. Matching is by whole path segment: `"/pay"` covers `/pay/abc` but
  no longer matches `/payments`. The kit keeps its own `config.matcher`
  because Next reads it statically:

  ```ts
  // src/proxy.ts
  import { createProxy } from "@merqo/ui/next";
  import { updateSession } from "@/lib/supabase/middleware";

  export const proxy = createProxy({
    updateSession,
    noncePrefixes: ["/admin", "/dashboard", "/login"],
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  };
  ```

- `themeProps`: spread onto next-themes' `ThemeProvider`
  (`attribute: "class"`, system default, no transition on change).
- `buildRobots({ vercelEnv, indexable? })`: body of `src/app/robots.ts`.
  Only `production` is crawlable; `indexable: false` keeps a kit closed
  even there.

  ```ts
  export default function robots() {
    return buildRobots({ vercelEnv: process.env.VERCEL_ENV });
  }
  ```

- `readPublicEnv({ NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY })`:
  throws naming the missing variable, else returns `{ supabaseUrl,
  supabasePublishableKey }`. Write the `process.env.NEXT_PUBLIC_*`
  references literally in the kit so Next inlines them.
## Supabase and auth plumbing

Four server-safe subpath entries replace the copies in each kit's
`src/lib/supabase/*`, `src/lib/legal-gate.ts` and `auth/callback/route.ts`.
`@supabase/ssr` and `@supabase/supabase-js` are optional peer dependencies;
`next` is needed for everything except `@merqo/ui/supabase`. None of these
entries carries `"use client"`. Each takes the kit's public settings as
arguments, so the package reads no environment variables.

- `@merqo/ui/supabase` (no `next` import): `createSupabaseBrowserClient<Database, "schema">({ url, publishableKey, schema?, cookieDomain? })`,
  `readAllRows(page)`, `readAllRowsResult(page)` and `listAllUsers(client)`.
  `page(from, to)` receives an inclusive range for `.range(from, to)`;
  `readAllRows` pages 1000 rows at a time until an empty page and throws on
  any failed page instead of returning a partial list, and `readAllRowsResult`
  maps that throw to `{ data: null, error }` for routes that answer 503.
  `listAllUsers` walks every `auth.admin.listUsers` page (1000 each, 50-page
  ceiling) and returns `{ data: { users: { id, email }[] } | null, error }`.
- `@merqo/ui/supabase/server` (imports `next/headers`):
  `createSupabaseServerClient(config)` for the signed-in user, and
  `createSupabaseServiceClient({ url, secretKey, schema? })`, which bypasses
  RLS, attaches no request cookies and throws when `secretKey` is empty.
- `@merqo/ui/supabase/middleware` (imports `next/server`):
  `updateSupabaseSession(request, { url, publishableKey, schema?, cookieDomain?, protectedPrefixes, loginPath?, refreshPublicRoutes? })`
  refreshes the session cookies, redirects an anonymous visitor on a
  protected prefix to `loginPath` (default `/login`), treats a `getUser`
  error or throw as signed out, and expires a host-only duplicate of a shared
  domain auth cookie. Public paths skip the auth call unless
  `refreshPublicRoutes` is set (merqo uses it so a returning visitor's token
  keeps rotating).
- `@merqo/ui/auth` (imports `next/server`): `handleAuthCallback(request, options)`
  and `checkLegalAcceptance(email, options)`.

```ts
// src/lib/supabase/server.ts
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@merqo/ui/supabase/server";

const config = {
  url: publicEnv.supabaseUrl,
  publishableKey: publicEnv.supabasePublishableKey,
  schema: "qkit",
  cookieDomain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
};
export const createServerClient = () => createSupabaseServerClient<Database, "qkit">(config);
export const createServiceClient = () =>
  createSupabaseServiceClient<Database, "qkit">({
    url: config.url,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    schema: "qkit",
  });

// src/app/auth/callback/route.ts
import { handleAuthCallback } from "@merqo/ui/auth";

export const GET = (request: Request) =>
  handleAuthCallback(request, {
    createClient: createServerClient,
    defaultNext: "/dashboard",
  });

// src/lib/legal-gate.ts
import { checkLegalAcceptance as check } from "@merqo/ui/auth";

export const checkLegalAcceptance = (email: string) =>
  check(email, {
    createClient: createServiceClient,
    customerSecret: process.env.MERQO_CUSTOMER_SECRET,
    merqoBaseUrl: process.env.MERQO_BASE_URL,
  });
```

`handleAuthCallback` options: `createClient`, `defaultNext` (the kit's
post-login target: `/dashboard`, `/post-login`, ...), `loginPath` (default
`/login`; failures go to `loginPath?error=oauth`), and the optional
`nextCookie: { name, path }` (read when the query has no `next`, cleared on
every redirect), `afterSignIn(supabase)` (stockkit creates the vendor row
here) and `recovery: { path, onRecovery? }` (a password-reset exchange goes
to `path` instead of `next`; printkit mints its recovery-window cookie in
`onRecovery`). `next` always goes through `safeRedirectPath`, so an absolute
URL, `//host`, `/\host` or a control character falls back to `defaultNext`.
A missing code, a failed or thrown exchange, or a throwing `afterSignIn`
redirects to the login error.
Redirects are built from the request origin, so a kit behind a proxy must make
sure that origin is the public one.

`checkLegalAcceptance` asks merqo's `/api/merqo/legal-status` and compares
the answer with `LEGAL_VERSIONS`. The answer is cached per lower-cased email
in the kit's `legal_check_state` table (`email`, `checked_at`, `is_current`)
for 5 minutes; a stale, invalid or future-dated row is a miss. It fails
closed (returns `false`) for a missing secret, an unreachable merqo, a
non-2xx or malformed response and a client error. Only the cache write fails
open: if the upsert returns `{ error }` or throws, the error is logged and a
vendor merqo reported as current is still `true`.

## Kit API helpers

`@merqo/ui/kit-api` is a server-only subpath (no React, no `"use client"`,
not re-exported from the package root) holding the plumbing the kits used to
copy. Every helper that talks to a store or the network takes it as an
injected dependency, and none throws to the caller except `callMerqoRpc`.

- `merqoBaseUrl(env?)`: `MERQO_BASE_URL` or `https://www.merqo.io`, read per
  call. `merqoUrl(path, query?, base?, {development?})` builds an absolute
  URL and returns `null` for a non-https base (`http://localhost` only with
  `development: true`) or a `path` that would leave the base origin.
- `createMerqoClient({secret, baseUrl?, timeoutMs?, development?, fetch?})`:
  `get(path, query?)` and `post(path, body)` with a bearer secret, a 5 second
  default timeout and `redirect: "error"`. Both resolve to
  `{ok: true, status, data}` or `{ok: false, status, error}` where `error` is
  `missing_secret`, `invalid_url`, `http_error`, `invalid_json`, `timeout` or
  `network_error`. Map the result to the kit's own fail-closed policy.
- `callMerqoRpc<Args, Returns>(supabase, fnName, args)`: calls
  `supabase.schema("merqo").rpc(...)` and throws `"<fn> failed: <message>"`.
- `postKitCallback({url, secret}, body, {development?, timeoutMs?, fetch?})`:
  the signed kit callback. Refuses anything but https (and URLs with
  credentials); `http://localhost` is allowed only with `development: true`.
  Uses `redirect: "error"` and a 5 second timeout. Resolves to `{ok: true}` or
  `{ok: false, reason, status?}`; failures are logged by error name only.
- `hashApiKey(secret)` (sha256 hex) and
  `verifyKitAuth(request, {store, rateLimit?})`: checks
  `Authorization: Bearer <kit_slug>:<secret>` against a `KitKeyStore`
  (`getSecretHash`, optional `touch` and `logFailure`) using a constant-time
  compare, and resolves to `{kitSlug}` or `null`. The optional `rateLimit`
  counts attempts per client IP (`limit`) and per kit slug (`slugLimit`,
  defaults to `limit`) and fails closed unless `failOpen: true`. The slug
  bucket stops a rotating IP from bypassing the limit, at the cost that a
  flood naming a real slug can lock that kit out for one window. Pass
  `trustedHeaders` to choose the IP headers (see `clientIp`). `KitKeyStore.
  logFailure` receives the request's `kitSlug`, which is untrusted: sanitise
  it before writing it anywhere.
- `rateLimit`, `rateLimitStrict` and `rateLimitCheck` over a
  `RateLimitStore` (`hit(key, limit, windowSeconds)` resolves true while
  within the limit). `rateLimit` fails open on a store error,
  `rateLimitStrict` fails closed, `rateLimitCheck` returns
  `"ok" | "limited" | "error"`. `clientIp(headers, {trustedHeaders?})` returns a
  valid IP from the first trusted header present, or `null`. The default is
  `["x-vercel-forwarded-for"]`, which is trustworthy only on Vercel, where
  the edge overwrites it. Behind any proxy that does not overwrite the
  headers you list, a client can forge its IP: set `trustedHeaders` to
  what your proxy sets (`x-forwarded-for` uses the last hop) or treat the
  result as spoofable. `x-real-ip` is never read unless listed.
  `digest(value)` is sha256 hex for counter keys;
  `createMemoryRateLimitStore()` is a per-process fixed-window store for
  tests.
- `ActionResult<T>` and `isActionError(result)`: the Server Action result
  shape, `{success: true} & T` or `{success: false, error}`.

## Z-index scale

This package has no shared z-index token or constant — each component picks
its layer independently, following one implicit ladder. Documenting it here
so a consuming kit knows where its own page-level overlays should land
relative to these, without having to grep every component's className:

- **`z-10`** — `DashboardNav`'s mobile-menu tap-away scrim (the dimming
  backdrop behind the open mobile nav panel).
- **`z-20`** — sticky header shells: `DashboardNav`'s and `LandingNav`'s
  `<header>`, and `DashboardNav`'s mobile nav panel itself (which must sit
  above its own `z-10` scrim, and above normal page content scrolling
  beneath the sticky header).
- **`z-40`** — `DashboardTour`'s floating replay button (`fixed`,
  bottom-right on every page) — above normal content and the sticky nav,
  but below any modal-style overlay so a tour replay never traps focus
  above an open sheet/dropdown/popover.
- **`z-50`** — the transient overlay layer: `ui/dropdown-menu.tsx`,
  `ui/sheet.tsx`, `ui/popover.tsx`, `ui/tooltip.tsx`. These are the
  topmost layer in the package because they're all short-lived,
  user-triggered overlays that must never be occluded by anything else
  this package renders.

A kit adding its own overlay (a toast stack, a global modal, etc.) should
pick a value based on where in this ladder it belongs — e.g. above `z-50`
for something that must outrank an open Sheet/Popover, between `z-20` and
`z-40` for a page-level banner that shouldn't cover the tour's replay
button, etc.

## Audit trail standard

Not a shared library — each kit owns its own Supabase schema and writes its
own migration, same as everywhere else in the family (no cross-schema
queries, no shared server code). This section documents the _shape_ every
kit's audit trail should follow, the same way the Z-index scale above
documents a convention without shipping a shared constant. Written here
(2026-08-18) after a ground-truth check found the pattern already exists,
independently, in all four live kits (qkit, loopkit, paykit, stockkit) —
same table shape, copied kit-to-kit, but drifting in coverage. This section
exists so the next kit that adds or extends its audit trail copies the
same target, not whatever the most recently-read kit happened to do.

**Table shape** — one `admin_audit` table per kit's own schema:

```sql
create table <schema>.admin_audit (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references auth.users(id),
  action     text not null,
  target_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_created_idx on <schema>.admin_audit (created_at desc);
```

RLS: admins may `select`; no `insert`/`update`/`delete` policy for anyone —
writes only happen through the service-role client, same as the rest of
each kit's admin surface.

**Write path** — a small `recordAudit()` helper (paykit's
`src/lib/admin-audit.ts` is the server-only reference implementation) that inserts a
row and swallows its own failure: the action being recorded must never fail
_because_ logging it failed, but a logging failure should still surface in
server logs so a broken trail doesn't go unnoticed.

**Coverage** — log every mutating action a vendor or an admin could
plausibly need to reconstruct or dispute later (plan changes, pricing
changes, refunds, payment confirmations, cancellations, redemptions), not
only today's `/admin`-route actions. A cross-kit write initiated by merqo
on a vendor's behalf (e.g. a hub-triggered plan override) should also land
a row in the _target_ kit's own `admin_audit`, attributed to the merqo
system actor — never a silent service-role bypass.

**Domain ledgers count too** — a kit's own append-only domain data (e.g.
`loopkit.stamp_events`, `paykit.transactions`, `stockkit.stock_movements`)
already serves as a vendor-facing audit trail for that kit's core activity
and doesn't need to be duplicated into `admin_audit`. A kit whose core
mutable state has no such ledger (e.g. qkit's `orders.order_status`, a
single column overwritten on every transition, no history) should add one
before calling its own audit story complete.

**Immutability** — `admin_audit` and any domain ledger should be
append-only in practice, not just by convention: nothing today stops the
service-role client itself from editing or deleting a row. A kit relying on
its audit trail for a real dispute should add a DB-level guard (revoke
`update`/`delete` from the relevant role, or a rejecting trigger) rather
than assume application code alone won't touch it later.

**Retention** — state a retention window explicitly in the kit's own
`AGENTS.md` (5 years is the reference point — Singapore's IRAS record-
keeping norm for a small business) rather than growing the table forever
with no stated policy.

**Built (2026-08-19):** `AuditLogTable` (see Components below) — a
shared render component, same class as
`VendorTelegramSection` (renders rows uniformly, each kit passes its own
data, no backend coupling inside the package), so a vendor-facing
"Activity" view can look the same across kits without each one
hand-rolling its own table. A kit can adopt it today; nothing forces
that before its own `admin_audit` coverage above is real — the
component just renders whatever rows it's given.

## Usage

```tsx
import { InfoTooltip } from "@merqo/ui";

export function SettingLabel() {
  return (
    <div className="flex items-center gap-1.5">
      <span>API rate limit</span>
      <InfoTooltip
        content="Requests over this limit are queued, not rejected."
        ariaLabel="More about the API rate limit"
      />
    </div>
  );
}
```

## Development

```bash
pnpm install --frozen-lockfile
pnpm check          # ESLint and TypeScript
pnpm build          # required before artifact regression tests
pnpm test
pnpm test:coverage  # all production source; 80% minimum in each metric
```

ESLint checks TypeScript, React Hooks and SonarJS rules, including unused values,
commented-out code and trailing application comments. Test fixtures retain narrow
exceptions for fake network values and concise case annotations. Comments explain
durable constraints or public contracts; change history belongs in commits.

Coverage thresholds apply to statements, branches, functions and lines. Generated
build output, declarations and test setup are excluded; untested production source
is included. Component tests do not replace validation in consuming applications.
Changes to this checkout reach consumers only after a deliberate version/tag
update; no release is created by these checks. A release changes `version` in
`package.json`, the install snippet above and the changelog heading together,
then tags `v<version>`. `src/release-version.test.ts` fails when they disagree.

### Upload and navigation contracts

Deferred image previews belong to their mounted ImageUploader. Keep its preview
value after a failed form save so commitPendingImages can retry; replace that
value after a successful save. Replacing the value or unmounting releases the
owned browser preview. A commit that already captured an upload continues;
callers still remove uploaded storage objects when their persistence fails.
Unmounting before deferred resize completes does not start an upload.

Image resizing releases decoded pixels when drawing fails and uses recognized
image MIME types for fallback extensions. Browser MIME checks are only UX:
storage policies and server validation must enforce ownership and allowed bytes.
storagePathFromPublicUrl parses a path, not an origin or authorization proof.

Money inputs reject cents outside JavaScript's safe integer range. Onboarding
tour loading, step resolution and seen-state failures are reported to the console
without creating unhandled promise rejections. Tour step markup and CSS scope
are trusted application-authored configuration, never customer HTML.
