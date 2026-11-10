# src/auth

Auth helpers for the kits' sign-in flow (`@merqo/ui/auth`).

- `callback.ts`: `handleAuthCallback`, the code-exchange route handler body.
- `legal-gate.ts`: `checkLegalAcceptance`, the check that a user has accepted the current legal document versions.
- `index.ts`: the public entry.

Rule: both helpers take a minimal client interface instead of importing Supabase types, so they work with whichever `@supabase/supabase-js` version a kit pins. Server-only.
