# src/auth

Auth helpers for the kits' sign-in flow (`@merqo/ui/auth`).

- `callback.ts`: `handleAuthCallback`, the code-exchange route handler body.
- `confirm.ts`: `handleAuthConfirm` (POST handler that verifies an emailed `token_hash`), `authConfirmForwardUrl` (merqo's forwarder to a kit's own origin), `readAuthConfirmParams` and the `AUTH_CONFIRM_TYPES` guard.
- `confirm.test.ts`: tests for the confirm handler, the origin rule, param reading and the forwarder's hostile inputs.
- `legal-gate.ts`: `checkLegalAcceptance`, the check that a user has accepted the current legal document versions.
- `index.ts`: the public entry.

Rule: the helpers take a minimal client interface instead of importing Supabase types, so they work with whichever `@supabase/supabase-js` version a kit pins. Server-only.
