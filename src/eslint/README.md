# src/eslint

Shared lint configuration for the kits (`@merqo/ui/eslint`).

- `preset.ts`: `merqoEslintPreset`, the common rules (no em dash in copy, no literal colours, comment hygiene).
- `no-local-copies.ts` and `local-copies.ts`: `merqoNoLocalCopies`, which flags a kit re-declaring something this package already exports.
- `index.ts`: the public entry.

Rule: the caller passes its own `sonarjs` and `@typescript-eslint` plugin objects so ESLint sees one instance. A new rule changes lint in all six kits on their next pin bump, so add it with a test and a CHANGELOG note.
