# src/security

Security header builders (`@merqo/ui/security`).

- `csp.ts`: `buildCsp`, `createNonce`, `withNonceCsp`, `robotsHeaderFor`.
- `headers.ts`: `buildSecurityHeaders`, the nonce path prefixes and `THEME_SCRIPT_HASH`.

Rule: `THEME_SCRIPT_HASH` is the hash of next-themes' inline bootstrap, so a next-themes bump can change it. Loosening any directive affects all six kits.
