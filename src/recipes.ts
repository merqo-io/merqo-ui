// Class recipes shared by the structural components so every kit gets the same
// card shape and type hierarchy from its own tokens. Private: not exported from
// the package. Each constant says when to use it; pick by hierarchy, not looks.

// The page's primary object: one lifted card. Anything repeated or secondary
// uses GROUP instead, so the shadow means "look here first".
export const SURFACE =
  "rounded-2xl border bg-card text-card-foreground shadow-sm";

// A box inside a page or inside a standalone surface, usually repeated.
export const GROUP = "rounded-xl border bg-card text-card-foreground";

// The small sentence-case label for fields, badges, column headings and
// card-level kickers. Quiet by design: weight and colour carry it, not caps.
export const LABEL = "text-sm font-medium text-muted-foreground";

// The uppercase tracked label above a page-level section title. Only page
// sections (Section, PageHeader, Faq) use it; anywhere else use LABEL.
export const EYEBROW =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

// The single h1 that names a page.
export const PAGE_TITLE =
  "font-display text-3xl font-bold tracking-tight text-balance break-words";

// The title of a standalone card or panel.
export const CARD_TITLE =
  "font-display text-2xl font-bold tracking-tight text-balance";

// The title of a block inside a page or card.
export const SECTION_TITLE = "text-base font-semibold";

// Motion tokens. One ease-out curve; the duration says what kind of change it
// is. FEEDBACK answers a press or hover, STATE is a control changing state,
// OVERLAY is a layer arriving. Exits are always shorter than enters.
export const MOTION_FEEDBACK = "duration-150 ease-out";
export const MOTION_STATE = "duration-200 ease-out";
export const MOTION_OVERLAY = "duration-300 ease-out";

// The reduced-motion contract for every enter/exit animation: the duration
// collapses to 1ms rather than the animation being removed, so animationend
// still fires and Radix Presence unmounts on time, while the slide and zoom
// offsets are zeroed and only the opacity change remains. Important, because
// the data-state and data-side variants set the same properties with higher
// specificity.
export const REDUCED_MOTION =
  "motion-reduce:duration-1! motion-reduce:[--tw-enter-scale:1]! motion-reduce:[--tw-enter-translate-x:0]! motion-reduce:[--tw-enter-translate-y:0]! motion-reduce:[--tw-exit-scale:1]! motion-reduce:[--tw-exit-translate-x:0]! motion-reduce:[--tw-exit-translate-y:0]!";

// Modal layers (sheet, dialog, alert dialog and their scrims): 300ms in, 200ms
// out. The base duration covers every non-closed state, so the tooltip's
// delayed-open and instant-open states get it too.
export const OVERLAY_TRANSITION = `ease-out duration-300 data-[state=closed]:duration-200 ${REDUCED_MOTION}`;

// Small floating layers (menus, popovers, select, tooltip): quicker than a
// modal because they sit beside the thing that opened them.
export const POPUP_TRANSITION = `ease-out duration-200 data-[state=closed]:duration-150 ${REDUCED_MOTION}`;

// A pressed control. Tailwind v4 fires hover: only on hover-capable pointers,
// so active: is what touch users see. The scale is dropped under reduced
// motion and the colour step each site adds stays.
export const PRESS = `transition-[color,background-color,border-color,outline-color,box-shadow,opacity,transform] ${MOTION_FEEDBACK} active:scale-[0.98] motion-reduce:active:scale-100`;

// A surface that is tappable as a whole (not one with a button inside it): the
// only card that lifts on hover. Hover may deepen the shadow but never moves
// the hit target; the press settles it back and nudges it in.
export const INTERACTIVE_SURFACE = `${SURFACE} transition-[box-shadow,transform] ${MOTION_FEEDBACK} hover:shadow-md active:shadow-xs active:scale-[0.98] motion-reduce:active:scale-100`;

// The shadow for a layer floating above the page. Bigger than SURFACE so the
// stack reads: page, card, floating layer.
export const OVERLAY_ELEVATION = "shadow-lg";

// The full-width action that finishes an auth step (sign in, verify, confirm,
// set password). h-11 is 44px, the touch-target minimum, and as a fixed height
// it replaces Button's default h-9 under twMerge where min-h-11 would only
// stretch it. One radius and one weight so every auth screen reads alike.
export const AUTH_BUTTON = `${PRESS} h-11 w-full rounded-xl text-base font-semibold`;
