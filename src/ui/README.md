# src/ui

Private shadcn/ui (new-york) primitives that the shared components build on.

Only the `ui/*` entries in `ENTRIES` in `tsup.config.ts` are public, through `@merqo/ui/primitives`. That covers alert dialog, badge, button, card, checkbox, dialog, dropdown menu, input, label, popover, select, sheet, skeleton, switch, tabs, textarea, toggle, toggle group and tooltip. Any other module here stays internal and may change freely.

Rules: each file declares its own `"use client"`; do not add a barrel, since a barrel mixes Server and Client Components. Use design tokens, never literal colour, font or radius values. Do not export a part nothing uses; knip checks this.
