import type { ReactElement } from "react";

export interface BrandIconOptions {
  /** One or two letters, e.g. "Q". */
  monogram: string;
  /** Tile colour. Supplied by the kit; this package ships no colour values. */
  background: string;
  /** Monogram colour. */
  foreground: string;
  /** CSS font-family for the monogram. Unset inherits the renderer default. */
  fontFamily?: string;
  /** CSS border-radius for the tile, in px or a CSS length. Unset gives square corners. */
  radius?: number | string;
}

/** Favicon size for `app/icon.tsx`. */
export const ICON_SIZE = { width: 32, height: 32 } as const;
/** Apple's home-screen touch-icon size for `app/apple-icon.tsx`. */
export const APPLE_ICON_SIZE = { width: 180, height: 180 } as const;

/**
 * The kit mark as an ImageResponse child. Pass a system `fontFamily` rather
 * than the kit display face: it is fine at icon scale and avoids shipping
 * font data to the icon route.
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
        fontFamily: options.fontFamily,
        fontWeight: 700,
        fontSize: size * 0.62,
        lineHeight: 1,
        borderRadius: options.radius,
      }}
    >
      {options.monogram}
    </div>
  );
}
