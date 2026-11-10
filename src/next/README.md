# src/next

Next.js glue shared by the kits (`@merqo/ui/next`).

- `env.ts`: `readPublicEnv`, typed public env reads.
- `proxy.ts`: `createProxy`, the route-protection factory for `src/proxy.ts`.
- `robots.ts`: `buildRobots`.
- `theme-props.ts`: `themeProps` and its alias `THEME_PROVIDER_PROPS`, the `next-themes` provider props.

Rule: `THEME_PROVIDER_PROPS` is a public alias the kits still import, so keep it. Nothing here may import React components.
