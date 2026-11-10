# src/supabase

Supabase client factories (`@merqo/ui/supabase`, `/supabase/server`, `/supabase/middleware`).

- `browser.ts`: `createSupabaseBrowserClient`.
- `server.ts`: `createSupabaseServerClient` (cookie-bound, RLS applies) and `createSupabaseServiceClient`.
- `middleware.ts`: `updateSupabaseSession` for the proxy.
- `read-all.ts`, `list-all-users.ts`: paginated readers.
- `types.ts`: `SupabaseConfig`, `SchemaOf`.

Rule: the service-role client bypasses RLS and is server-only. It sits on its own subpath so client bundles never pull it in.
