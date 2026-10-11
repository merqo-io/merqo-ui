# Changelog

## [Unreleased]

### Fixed

- A long `InfoTooltip` or `Section` tooltip no longer runs off a phone screen. The default-mode tooltip had no maximum width, so its text stayed on one line (1,271px for a 229-character sentence on the merqo dashboard). It now wraps at 20rem, or at the viewport width on a narrower screen.

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
