# src/admin

Audit and ops-event writers shared by the kits' admin surfaces (`@merqo/ui/admin`).

- `audit.ts`: `recordAudit` and `recordOpsEvent`, plus the minimal `AuditClient` shape they accept.
- `index.ts`: the public entry; re-exports only what kits may import.

Rule: the writers take the caller's Supabase client (or a factory for one) and never create their own, so authorization stays in the calling kit's database policies. Server-only; do not import from a client component.
