# Public page rules

Applies to every public page of the kits: landing, about, FAQ, legal, guides. Does not apply to vendor dashboards, admin or auth screens.

These rules describe structure and behaviour. Colour, font and radius values stay in each kit's own tokens; `@merqo/ui` ships none.

## 1. Shape

- Surfaces (cards, panels, FAQ rows, pricing tiers) use one small radius: the kit's `rounded-lg`, driven by its `--radius` token.
- A product object keeps its real edge: the ticket's torn edge, the phone's corners (`PhoneFrame` uses `rounded-3xl`).
- Pills (`rounded-full`) are for status only, never for cards or sections. Round icon buttons such as back-to-top are allowed.
- No literal `rounded-[...]` value anywhere.

## 2. Shadow

- No shadow on page content. Rules and borders separate things.
- Shadow is only for things that float above the page: sheets, menus, the back-to-top button.
- Known exceptions, kept by the owner's decision: `Section` keeps `shadow-sm`; `ElevatedCard` keeps `shadow-md` (it is a dashboard component that public pages should not use).
- No literal shadow value.

## 3. Hover, press and focus

- No lift, scale or glow on hover.
- Hover darkens or underlines, nothing else.
- Every control has one pressed state (`active:`) that works by touch. Nothing a vendor must read or operate may depend on hover.
- One focus ring, the kit's `ring` token, on `focus-visible`.
- Touch targets are at least 44px tall.

## 4. Motion

- Motion only when something in the product moves: an order builds, a ticket prints, a stamp lands.
- Scroll plays a demo and rewinds it. Scroll never reveals or fades in a section.
- With reduced motion, everything is shown complete and stays operable. The same holds without JavaScript.
- No motion library; CSS transitions and the shared `useScrollPlay` hook only.

## 5. Threes

- A landing journey has three steps.
- A landing shows three FAQ rows; the fuller list lives on `/faq`.
- No three-card feature grids and no trust strip.

## 6. Copy

- No em dash in user-facing copy.
- A kit that is "In build" must not read or look as if it is live.
- No claim about money or payment that the code does not prove.

## How to check a change

- Test touch with `user.pointer({ keys: "[TouchA]", target })`, not `user.click`.
- Test the reduced-motion path.
- Look at it at phone width (375px) and in both colour schemes before promotion.

## Decided

1. These shared rules live here. Each kit's `DESIGN.md` has a "Public pages" section that links to this file and records only the kit's own values (its `--radius`, its product object and real edge, any exception it takes), never restating a shared rule.
2. `Section` keeps `shadow-sm`.
3. Each kit keeps its own `--radius` value.
