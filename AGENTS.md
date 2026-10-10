# AGENTS.md: @merqo/ui

Shared structural and behavioural React components for the Merqo kit family:
qkit, paykit, printkit, loopkit, stockkit and merqo. `README.md` is the
consumer-facing source of truth for every export; read the entry for a
component before changing it.

## What matters most

- This package ships no colour, font-family or radius values. Components use
  shadcn's semantic Tailwind classes only, so each kit's own tokens drive the
  look. Never add a literal colour, font or `rounded-[...]` value.
- A change here reaches six apps that vendors use on phones and tablets.
  Anything a vendor must read or operate has to work by touch, not only by
  hover.
- No em dash in user-facing copy.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm check          # eslint and tsc --noEmit
pnpm build          # tsup, then scripts/build-index.mjs, then declarations
pnpm test           # vitest; needs a prior pnpm build for build-output tests
pnpm test:coverage  # what CI runs; 80% minimum on every metric
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, build and
`pnpm test:coverage` on every pull request and on `main`.

## Module and client boundaries

- Each source module declares its own `"use client"` when it needs one. The
  package root, `dist/index.js`, is a plain re-export shim written by
  `scripts/build-index.mjs` and must never carry a directive: a package-wide
  directive turns plain exports such as `SOCIAL_LINK_FIELDS` into opaque client
  references in a Server Component. `src/build-output.test.ts` guards this.
- Do not add a barrel that mixes server and client code.
- A new export needs three things together: the module under `src/`, a line in
  `src/index.ts`, and an entry in `ENTRIES` in `tsup.config.ts`.
- `src/ui/` holds the private shadcn primitives. They are not exported.

## Working rules

- Test first. Add a failing test beside the module (`src/<name>.test.tsx`),
  watch it fail, then make it pass. Simulate touch with
  `user.pointer({ keys: "[TouchA]", target })`; `user.click` hovers first and
  hides touch-only bugs.
- Before changing a default or a prop, check how every kit uses the export.
  The kits are sibling folders of this repo; `node scripts/usage-matrix.mjs`
  counts import sites and `docs/usage-matrix.md` explains the result.
- Update `README.md` and `CHANGELOG.md` in the same change as the behaviour.
- Comments explain durable constraints, not history. ESLint rejects
  commented-out code and inline trailing comments in source files.
- Never read or write `.env*` or `secrets/**`.
- Never commit to `main`. Work on a feature branch and open a pull request.
- Never bypass hooks or checks (`--no-verify` and the like).
- `AGENTS.md`, `CLAUDE.md` and `.github/` are governance files: change them
  only with the owner's approval.
- Other agents open pull requests under the owner's account too. Leave their
  branches, pull requests and worktrees alone.

## Releasing

Nothing releases automatically. Merging to `main` changes nothing for the
kits until they move their pin. Do not merge, tag or bump a version without
the owner's say.

1. In one change, set the same version in three places: `version` in
   `package.json`, the install snippet in `README.md`, and a
   `## [x.y.z] - YYYY-MM-DD` heading in `CHANGELOG.md`.
   `src/release-version.test.ts` fails when they disagree.
2. Merge the pull request, then push an annotated tag `vX.Y.Z` on the merge
   commit.
3. In the pull request, state the version bump and which kits should pick it
   up.

## Moving a kit to a new release

Each kit pins an immutable commit, not the tag:
`"@merqo/ui": "github:merqo-io/merqo-ui#<40-character sha of the tagged commit>"`.
A tag can be moved; a commit cannot. One pull request per kit changes:

- `package.json`: the pin.
- `pnpm-lock.yaml`: run a plain `pnpm install`. The diff should touch the
  `@merqo/ui` entries only.
- `pnpm-workspace.yaml`: the `allowBuilds` entry for the new
  `https://codeload.github.com/merqo-io/merqo-ui/tar.gz/<sha>` URL, replacing
  the old one. pnpm 11 runs this package's build only for an allowed URL.
- `CHANGELOG.md`: an entry under `[Unreleased]`.
- The root `README.md`: the kits' `readme-freshness` check fails a pull
  request that changes a folder without touching that folder's README.

The kits' git hooks need a full install in the checkout: pre-commit runs
`tsc` and a frozen-lockfile install, pre-push runs the harness check,
`pnpm run check` and the whole test suite.
