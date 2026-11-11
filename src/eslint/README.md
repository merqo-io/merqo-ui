# src/eslint

Shared lint configuration for the kits (`@merqo/ui/eslint`).

- `preset.ts`: `merqoEslintPreset`, the common rules (no em dash in copy, no literal colours, comment hygiene).
- `no-local-copies.ts` and `local-copies.ts`: `merqoNoLocalCopies`, which flags a kit re-declaring something this package already exports. Besides file and import patterns, `importNames` limits a piece to imports of given names (`cn`, the form class constants) and `requiredImport` marks a file the framework needs (`error.tsx`, `global-error.tsx`, `not-found.tsx`) that must render the shared export, so the wrapper exemption does not apply to it.
- `index.ts`: the public entry.

Rule: the caller passes its own `sonarjs` and `@typescript-eslint` plugin objects so ESLint sees one instance. A new rule changes lint in all six kits on their next pin bump, so add it with a test and a CHANGELOG note.

`requiredImport` accepts a value import or a re-export from the `@merqo/ui` root; type-only imports, subpaths and namespace imports do not count.
