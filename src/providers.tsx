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

// Sonner's action button is a small chip; the pseudo-element grows the touch
// target to 44px on coarse pointers without changing the desktop size.
const ACTION_BUTTON_CLASS =
  "relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']";

/**
 * Sonner toaster that follows the resolved theme (sonner defaults to light)
 * and gives toast action buttons a 44px touch target.
 */
export function Toaster({ toastOptions, ...props }: ToasterProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const actionButton = toastOptions?.classNames?.actionButton;
  return (
    <Sonner
      position="top-right"
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          actionButton: actionButton ? `${ACTION_BUTTON_CLASS} ${actionButton}` : ACTION_BUTTON_CLASS,
        },
      }}
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
