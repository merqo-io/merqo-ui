export type RobotsOptions = {
  /** `VERCEL_ENV`; only `production` is ever crawlable. */
  vercelEnv: string | undefined;
  /** Set false for a kit that must stay closed even on production. Default true. */
  indexable?: boolean;
};

// Structurally assignable to Next's `MetadataRoute.Robots`. Importing that type
// from "next" would load next/types/global.d.ts, which narrows the global
// `NodeJS.ProcessEnv` for every consumer of these declarations.
export type RobotsRoute = {
  rules: { userAgent: string; allow: string } | { userAgent: string; disallow: string };
};

/** Body of a kit's `src/app/robots.ts`. */
export function buildRobots({
  vercelEnv,
  indexable = true,
}: RobotsOptions): RobotsRoute {
  return indexable && vercelEnv === "production"
    ? { rules: { userAgent: "*", allow: "/" } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
