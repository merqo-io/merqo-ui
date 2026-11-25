# src/ui

Private shadcn/ui (new-york) primitives that the shared components build on.

Only the `ui/*` entries in `ENTRIES` in `tsup.config.ts` are public, through `@merqo/ui/primitives`. That covers alert, alert dialog, badge, button, card, checkbox, dialog, dropdown menu, empty, input, item, label, popover, select, sheet, skeleton, spinner, switch, tabs, textarea, toggle, toggle group and tooltip. Any other module here stays internal and may change freely.

Rules: each file declares its own `"use client"`; do not add a barrel, since a barrel mixes Server and Client Components. Use design tokens, never literal colour, font or radius values. Do not export a part nothing uses; knip checks this.

## Local changes to the shadcn originals

- `button`: every variant has an `active:` colour step, and the base carries the `PRESS` recipe (0.98 scale, dropped under reduced motion) instead of `transition-all`.
- `sheet`, `dialog`, `alert-dialog`: enter and exit timing and the reduced-motion contract come from `OVERLAY_TRANSITION` in `src/recipes.ts`.
- `dropdown-menu`, `popover`, `select`, `tooltip`: same, from `POPUP_TRANSITION`.
- Reduced motion shortens the duration to 1ms and zeroes slide and zoom instead of setting `animate-none`, so `animationend` still fires.

## Deliberate local changes vs upstream shadcn

| Primitive | Differs from upstream | Why |
| --- | --- | --- |
| `button` | `PRESS` recipe and `active:` colour steps; `pointer-coarse:` heights on every size | Touch feedback and 44px targets |
| `input` | `pointer-coarse:h-11`; `size="lg"` is `h-11 rounded-xl text-base` | 44px targets on touch; `lg` is the documented large field style the kits already use, so its radius stays `rounded-xl` |
| `dropdown-menu` | `pointer-coarse:min-h-11` on item, radio item and sub trigger; `POPUP_TRANSITION`; `DropdownMenuGroup` carries a `data-slot` | Touch rows; shared popup motion. There is no checkbox item because nothing uses one |
| `tabs` | `h-11` triggers that split the bar, tinted active state, eased colour change; the focus ring matches the other primitives | Touch target and one focus look |
| `alert` | `default` and `destructive` variants only, `role="alert"` by default, no icon colour variants | Errors are announced at once; a polite notice passes `role="status"` |
| `sheet`, `dialog`, `alert-dialog` | `OVERLAY_TRANSITION` timing | Shared motion and reduced-motion contract |
| `popover`, `select`, `tooltip` | `POPUP_TRANSITION` timing; select trigger is 44px on coarse pointers | Same |
| `empty` | Verbatim upstream parts. `EmptyState` never uses `EmptyMedia variant="icon"` | The tinted tile reads as generic; the bare icon is the house style |
| `spinner` | `motion-safe:animate-spin` instead of `animate-spin` | Reduced motion stops the spin; callers that already announce busy pass `aria-hidden` |
| `item` | Upstream, with `Separator` from `radix-ui` | No separate separator primitive is shipped |
| all animated primitives | Reduced motion shortens to 1ms instead of `animate-none` | `animationend` still fires |
