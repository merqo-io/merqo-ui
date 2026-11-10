# src

Source of `@merqo/ui`, the shared library for the six kit apps.

- Top-level `*.tsx` and `*.ts` files are the per-module public exports. Each is listed in `ENTRIES` in `tsup.config.ts` and re-exported by `index.ts`.
- Subfolders (`admin`, `auth`, `contracts`, `eslint`, `kit-api`, `legal`, `lib`, `next`, `security`, `supabase`, `testing`, `ui`) hold subpath entries or private building blocks; each has its own README.

Rules: each component module declares its own `"use client"`, `dist/index.js` never does, and there are no barrels beyond `index.ts`. A public export is API: removing or renaming one needs an owner decision and a usage check with `node scripts/usage-matrix.mjs`. `pnpm dlx knip@6.44.2` must stay clean.
