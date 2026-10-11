// @icons-pack/react-simple-icons exposes each icon as "./icons/<Name>.mjs" but
// ships its per-icon declarations as .d.ts, which TypeScript does not pair
// with an .mjs specifier. This ambient declaration types those deep imports;
// it has no runtime effect.
declare module "@icons-pack/react-simple-icons/icons/*.mjs" {
  import type * as React from "react";

  const Icon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
      color?: string;
      size?: string | number;
    }
  >;
  export default Icon;
  export const defaultColor: string;
}
