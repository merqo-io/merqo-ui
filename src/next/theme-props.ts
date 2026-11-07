/** next-themes `ThemeProvider` props shared by every kit. */
export const themeProps = {
  attribute: "class",
  defaultTheme: "system",
  enableSystem: true,
  disableTransitionOnChange: true,
} as const;

/** The name the kits used for their local copy. */
export const THEME_PROVIDER_PROPS: typeof themeProps = themeProps;
