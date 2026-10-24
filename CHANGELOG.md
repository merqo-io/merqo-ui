# Changelog

## [Unreleased]

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
