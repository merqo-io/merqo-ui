# src/lib

`utils.ts` holds `cn`, the `clsx` plus `tailwind-merge` class joiner used by the components and the private `src/ui` primitives. It is re-exported as `cn` from `@merqo/ui/primitives`. `lib/utils` is an internal build entry in `tsup.config.ts`, not a public subpath.

Rule: keep this folder to dependency-light helpers with no React component or server imports, since both server and client modules load it.
