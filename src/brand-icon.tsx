import type { ReactElement } from "react";

export interface BrandIconOptions {
  /** One or two letters, e.g. "Q". */
  monogram: string;
  /** Tile colour. Supplied by the kit; this package ships no colour values. */
  background: string;
  /** Monogram colour. */
  foreground: string;
}

/** Favicon size for `app/icon.tsx`. */
export const ICON_SIZE = { width: 32, height: 32 } as const;
/** Apple's home-screen touch-icon size for `app/apple-icon.tsx`. */
export const APPLE_ICON_SIZE = { width: 180, height: 180 } as const;

/**
 * The kit mark as an ImageResponse child. A system serif stands in for the
 * kit display face, which is fine at icon scale and avoids shipping font data
 * to the icon route.
 */
export function brandIcon(size: number, options: BrandIconOptions): ReactElement {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: options.background,
        color: options.foreground,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 700,
        fontSize: size * 0.62,
        lineHeight: 1,
        borderRadius: size * 0.22,
      }}
    >
      {options.monogram}
    </div>
  );
}
