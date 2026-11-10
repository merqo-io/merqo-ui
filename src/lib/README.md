# src/lib

`utils.ts` holds `cn`, the `clsx` plus `tailwind-merge` class joiner used by the components and the private `src/ui` primitives. It is also published through `@merqo/ui/primitives` as `lib/utils`.

Rule: keep this folder to dependency-light helpers with no React component or server imports, since both server and client modules load it.
