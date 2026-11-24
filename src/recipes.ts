// Class recipes shared by the structural components so every kit gets the same
// card shape and type hierarchy from its own tokens. Private: not exported from
// the package. Each constant says when to use it; pick by hierarchy, not looks.

// A card that stands alone on the page.
export const SURFACE =
  "rounded-2xl border bg-card text-card-foreground shadow-sm";

// A box inside a page or inside a standalone surface, usually repeated.
export const GROUP = "rounded-xl border bg-card text-card-foreground";

// The small label above a title.
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
