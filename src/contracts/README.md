# src/contracts

Zod schemas and types for payloads that cross kit boundaries (`@merqo/ui/contracts`).

- `entitlement.ts`: the entitlement tiers on the wire and their display labels, derived from `tierLabel`.
- `vendor-activity.ts`: the vendor activity and incident payloads kits report to merqo. This is the file the package subpath exposes.

Rule: a contract changes here first, then every kit moves its `@merqo/ui` pin. Never keep a local copy of a schema in a kit; the `no-local-copies` lint rule flags it.
