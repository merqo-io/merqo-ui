import * as React from "react";

export type AppLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Pass `next/link`'s `Link` to keep client-side navigation. */
export type AppLinkComponent = React.ComponentType<AppLinkProps>;

// This package never imports next/link: Node cannot resolve it as a bare ESM
// specifier, which would break the built entries.
export function DefaultAppLink(props: AppLinkProps): React.ReactElement {
  return <a {...props} />;
}
