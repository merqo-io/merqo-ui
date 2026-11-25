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
