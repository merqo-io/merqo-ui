"use client";

import * as React from "react";
import { DefaultAppLink, type AppLinkComponent, type AppLinkProps } from "./app-link";

const AppLinkContext = React.createContext<AppLinkComponent | undefined>(undefined);

/**
 * Sets the link component once for every client export below it. A function
 * cannot cross the Server to Client boundary as a prop, so a kit mounts this
 * in a `"use client"` providers file instead of passing `LinkComponent` from
 * a Server Component.
 */
export function AppLinkProvider({
  component,
  children,
}: {
  component: AppLinkComponent;
  children?: React.ReactNode;
}): React.ReactElement {
  return <AppLinkContext.Provider value={component}>{children}</AppLinkContext.Provider>;
}

/** The provided link component, or undefined when no provider is mounted. */
export function useAppLink(): AppLinkComponent | undefined {
  return React.useContext(AppLinkContext);
}

/**
 * A stable component that renders the provided link, or a plain `<a>`.
 * Client exports use it as their default so the choice is made inside this
 * component instead of by picking a component type during their own render.
 */
export function ContextAppLink(props: AppLinkProps): React.ReactElement {
  return React.createElement(useAppLink() ?? DefaultAppLink, props);
}
