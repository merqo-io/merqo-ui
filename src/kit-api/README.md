# src/kit-api

Server-side plumbing for the kits' API routes and their calls to merqo (`@merqo/ui/kit-api`).

- `action-result.ts`: the `ActionResult` shape and `isActionError`.
- `rate-limit.ts`: rate limiting with a pluggable store, `clientIp`, `digest`.
- `kit-auth.ts`: `verifyKitAuth` and `hashApiKey` for kit API keys.
- `merqo-client.ts`: `createMerqoClient`, `callMerqoRpc`, base URL helpers.
- `kit-callback.ts`: `postKitCallback`, the secret-bearing callback to a kit.

Rule: server-only, never import from a client component. `verifyKitAuth` checks the secret before any per-slug accounting so a valid key is never locked out. Plain http targets are for local development only.
