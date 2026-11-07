"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { themeProps } from "./next/theme-props";

/** next-themes provider preloaded with the family `themeProps`. */
export function ThemeProvider({ children, ...props }: ThemeProviderProps): React.ReactElement {
  return (
    <NextThemesProvider {...themeProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}

/** Sonner toaster that follows the resolved theme (sonner defaults to light). */
export function Toaster(props: ToasterProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      position="top-right"
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      {...props}
    />
  );
}

export interface ProvidersProps {
  children: React.ReactNode;
  theme?: Omit<ThemeProviderProps, "children">;
  toaster?: ToasterProps;
}

/** ThemeProvider plus Toaster, the usual root wrapper. */
export function Providers({ children, theme, toaster }: ProvidersProps): React.ReactElement {
  return (
    <ThemeProvider {...theme}>
      {children}
      <Toaster {...toaster} />
    </ThemeProvider>
  );
}
