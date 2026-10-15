# Changelog

## [Unreleased]

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
