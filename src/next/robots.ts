import type { MetadataRoute } from "next";

export type RobotsOptions = {
  /** `VERCEL_ENV`; only `production` is ever crawlable. */
  vercelEnv: string | undefined;
  /** Set false for a kit that must stay closed even on production. Default true. */
  indexable?: boolean;
};

/** Body of a kit's `src/app/robots.ts`. */
export function buildRobots({
  vercelEnv,
  indexable = true,
}: RobotsOptions): MetadataRoute.Robots {
  return indexable && vercelEnv === "production"
    ? { rules: { userAgent: "*", allow: "/" } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
