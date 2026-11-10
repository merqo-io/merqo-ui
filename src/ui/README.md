# src/ui

Private shadcn/ui (new-york) primitives that the shared components build on.

Only the `ui/*` entries in `ENTRIES` in `tsup.config.ts` are public, through `@merqo/ui/primitives`. The rest (alert dialog, dropdown menu, popover, sheet) are internal and may change freely.

Rules: each file declares its own `"use client"`; do not add a barrel, since a barrel mixes Server and Client Components. Use design tokens, never literal colour, font or radius values. Do not export a part nothing uses; knip checks this.
