# src/ui

Private shadcn/ui (new-york) primitives that the shared components build on.

Only the `ui/*` entries in `ENTRIES` in `tsup.config.ts` are public, through `@merqo/ui/primitives`. That covers alert, alert dialog, badge, button, card, checkbox, dialog, dropdown menu, input, label, popover, select, sheet, skeleton, switch, tabs, textarea, toggle, toggle group and tooltip. Any other module here stays internal and may change freely.

Rules: each file declares its own `"use client"`; do not add a barrel, since a barrel mixes Server and Client Components. Use design tokens, never literal colour, font or radius values. Do not export a part nothing uses; knip checks this.

## Local changes to the shadcn originals

- `button`: every variant has an `active:` colour step, and the base carries the `PRESS` recipe (0.98 scale, dropped under reduced motion) instead of `transition-all`.
- `sheet`, `dialog`, `alert-dialog`: enter and exit timing and the reduced-motion contract come from `OVERLAY_TRANSITION` in `src/recipes.ts`.
- `dropdown-menu`, `popover`, `select`, `tooltip`: same, from `POPUP_TRANSITION`.
- Reduced motion shortens the duration to 1ms and zeroes slide and zoom instead of setting `animate-none`, so `animationend` still fires.
