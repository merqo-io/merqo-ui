import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  recordAudit,
  recordOpsEvent,
  type AuditClient,
  type AuditClientSource,
} from "./audit";

function fakeClient(result: unknown = { error: null }) {
  const insert = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as unknown as AuditClient, from, insert };
}

afterEach(() => vi.restoreAllMocks());

describe("recordAudit", () => {
  it("inserts the entry into admin_audit with the FK column names", async () => {
    const { client, from, insert } = fakeClient();
    await recordAudit(client, {
      actorId: "u1",
      action: "vendor.suspend",
      targetId: null,
      detail: { reason: "x" },
    });
    expect(from).toHaveBeenCalledWith("admin_audit");
    expect(insert).toHaveBeenCalledWith({
      admin_id: "u1",
      action: "vendor.suspend",
      target_id: null,
      detail: { reason: "x" },
    });
  });

  it("logs the message of a returned error and resolves", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient({ error: { message: "rls" } });
    await expect(
      recordAudit(client, { actorId: "u", action: "a", targetId: "t", detail: {} }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith("admin_audit insert failed", "rls", "unknown");
  });

  it("swallows a thrown error and a failing client factory", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const throwing = {
      from: () => {
        throw new Error("boom");
      },
    } as unknown as AuditClient;
    await recordAudit(throwing, { actorId: "u", action: "a", targetId: null, detail: 1 });
    await recordAudit(
      async () => {
        throw new Error("no key");
      },
      { actorId: "u", action: "a", targetId: null, detail: 1 },
    );
    await recordAudit(() => throwing, { actorId: "u", action: "a", targetId: null, detail: 1 });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith("admin_audit insert failed", "boom", "Error");
    expect(spy).toHaveBeenCalledWith("admin_audit insert failed", "no key", "Error");
  });

  it("logs an unknown message for a non-error throw", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const throwing = {
      from: () => {
        throw "nope";
      },
    } as unknown as AuditClient;
    await recordAudit(throwing, { actorId: "u", action: "a", targetId: null, detail: 1 });
    expect(spy).toHaveBeenCalledWith("admin_audit insert failed", "unknown", "unknown");
  });

  it("accepts an async client factory", async () => {
    const { client, insert } = fakeClient();
    await recordAudit(async () => client, {
      actorId: "u",
      action: "a",
      targetId: null,
      detail: null,
    });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("keeps a kit's own action names type-checked", () => {
    type Action = "order.advance" | "booth.create";
    const entry = { actorId: "u", action: "order.advance" as Action, targetId: null, detail: {} };
    // @ts-expect-error actions outside the kit's union are rejected
    void recordAudit<Action>(fakeClient().client, { ...entry, action: "other" });
    void recordAudit<Action>(fakeClient().client, entry);
    expect(entry.action).toBe("order.advance");
  });

  it("accepts a typed Supabase client as the source", () => {
    const typed = {} as SupabaseClient;
    const source: AuditClientSource = typed as unknown as AuditClient;
    const direct: AuditClientSource = typed;
    expect([source, direct]).toHaveLength(2);
  });
});

describe("recordOpsEvent", () => {
  it("inserts a row and cuts ref and code to 64 characters", async () => {
    const { client, from, insert } = fakeClient();
    await recordOpsEvent(client, {
      vendorId: "v1",
      kind: "webhook_rejected",
      ref: "r".repeat(100),
      code: "c".repeat(100),
    });
    expect(from).toHaveBeenCalledWith("ops_events");
    expect(insert).toHaveBeenCalledWith({
      vendor_id: "v1",
      kind: "webhook_rejected",
      ref: "r".repeat(64),
      code: "c".repeat(64),
    });
  });

  it("logs message and code and never throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient({ error: { message: "secret detail", code: "42501" } });
    await recordOpsEvent(client, { vendorId: "v", kind: "k", ref: "r", code: "c" });
    expect(spy).toHaveBeenCalledWith("ops_events insert failed", "secret detail", "42501");

    const throwing = {
      from: () => {
        throw new TypeError("x");
      },
    } as unknown as AuditClient;
    await recordOpsEvent(throwing, { vendorId: "v", kind: "k", ref: "r", code: "c" });
    expect(spy).toHaveBeenLastCalledWith("ops_events insert failed", "x", "TypeError");

    const odd = {
      from: () => {
        throw 5;
      },
    } as unknown as AuditClient;
    await recordOpsEvent(odd, { vendorId: "v", kind: "k", ref: "r", code: "c" });
    expect(spy).toHaveBeenLastCalledWith("ops_events insert failed", "unknown", "unknown");
  });
});
