# src/testing

Test helpers the kits import in their own suites (`@merqo/ui/testing`).

- `render-smoke.ts`: `renderSmoke`, a page-error and console check over a list of routes.
- `totp.ts`: `totpCode`, for MFA flows in end-to-end tests.
- `global-setup.ts`: `createAuthenticatedGlobalSetup`, a Playwright global setup that stores signed-in state.

Rule: test-only. Never import this folder from application code, and use test accounts only.
