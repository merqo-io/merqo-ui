# Fresh-eyes sweep, 2026-10-24 roadmap (Phase 8, X-14 and X-20)

Close-out sweep for `@merqo/ui`: dead code found with knip, folder README gaps under `src/`. No version bump; entries sit under `[Unreleased]`.

## knip

Run pinned, not installed: `pnpm dlx knip@6.44.2`, configured by `knip.json`.

Findings before the sweep (no config, default entries): 6 (1 unused file, 4 unused exports, 1 duplicate export).
Findings after: 0.

The first finding was `scripts/usage-matrix.mjs`, a manual maintenance script. It is now an entry point (`scripts/*.mjs`), not removed.

### Removed

Private `src/ui` primitive parts with no importer in `src/`, none reachable from `src/index.ts` or any tsup entry (`dropdown-menu` and `sheet` are not in the `ui/*` primitives surface):

- `DropdownMenuGroup`, `DropdownMenuCheckboxItem` (and the `CheckIcon` import it alone used) in `src/ui/dropdown-menu.tsx`.
- `SheetTrigger`, `SheetClose` in `src/ui/sheet.tsx`.

The kits that mention these names (`qkit`, `loopkit`) use their own local shadcn copies, not `@merqo/ui`.

### Kept: public API

Everything reachable from `src/index.ts`, `src/legal.ts` or a tsup entry was left alone. Public but unused by kits is an owner decision; this sweep found none by knip, because knip treats entries as used. The usage matrix could not be regenerated from this nested worktree (the kit repos are not sibling folders of it), so `docs/usage-matrix.md` is unchanged.

### knip.json ignores

- `src/next/theme-props.ts`, `duplicates`: `THEME_PROVIDER_PROPS` is an intentional public alias of `themeProps` (the name the kits used for their local copy), exported from `@merqo/ui/next`. Removing it would break kits.

No other ignores. Entry points are `src/*.{ts,tsx}`, the subpath `index.ts` files, `src/supabase/{server,middleware}.ts`, the public `src/ui/*` primitives and `scripts/*.mjs`; `src/index.ts` and `src/contracts/vendor-activity.ts` are matched already.

## READMEs added

`src`, `src/admin`, `src/auth`, `src/contracts`, `src/eslint`, `src/kit-api`, `src/legal`, `src/lib`, `src/next`, `src/security`, `src/supabase`, `src/testing`, `src/ui`. None existed before. `src/legal/schedules` holds Markdown only and is described by `src/legal/README.md`. The published `files` list is `dist` only, and the build bundles imported modules, so the new `.md` files do not reach the package.

## Tests

1143 tests in 103 files before, 1143 in 103 after. Coverage 99.04% statements, 95.37% branches, 99.03% functions, 99.49% lines.

## Left for the owner

- Whether to add knip to CI (kept out of dependencies on purpose).
- Regenerating `docs/usage-matrix.md` from a checkout where the kits are siblings.
