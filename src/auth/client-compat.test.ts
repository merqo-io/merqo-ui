import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { AdminUsersClient } from "../supabase";
import type { AuthCallbackClient } from "./callback";
import type { LegalGateClient } from "./legal-gate";

// Compile-time guard: the structural client types must keep accepting a real
// SupabaseClient, or kits could not pass theirs without a cast.
describe("structural client types", () => {
  it("accept a real SupabaseClient", () => {
    const real = createClient("https://p.supabase.co", "key");
    const callback: AuthCallbackClient = real;
    const admin: AdminUsersClient = real;
    const legal: LegalGateClient = real;
    expect([callback, admin, legal]).toHaveLength(3);
  });
});
