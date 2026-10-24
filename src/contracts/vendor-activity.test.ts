import { describe, it, expect } from "vitest";
import { INCIDENT_KINDS, vendorActivityPayloadSchema } from "./vendor-activity";

const base = {
  active: true,
  plan: "pro" as const,
  status: "healthy" as const,
  metrics: [{ label: "Orders today", value: "12" }],
  lastActivityAt: "2026-10-24T08:00:00.000Z",
};

const recent = {
  kind: "print_failed",
  ref: "order-1",
  code: "printer_offline",
  at: "2026-10-24T08:00:00.000Z",
};

describe("vendorActivityPayloadSchema", () => {
  it("parses a payload without incidents", () => {
    expect(vendorActivityPayloadSchema.safeParse(base).success).toBe(true);
  });

  it("parses a payload with incidents and recent", () => {
    const result = vendorActivityPayloadSchema.safeParse({
      ...base,
      incidents: [{ kind: "print_failed", count: 2, lastAt: "2026-10-24T08:00:00.000Z" }],
      recent: [recent],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 10 recent entries", () => {
    const result = vendorActivityPayloadSchema.safeParse({
      ...base,
      recent: Array.from({ length: 11 }, () => recent),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown incident kind", () => {
    const result = vendorActivityPayloadSchema.safeParse({
      ...base,
      incidents: [{ kind: "meteor", count: 1, lastAt: "2026-10-24T08:00:00.000Z" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative incident count", () => {
    const result = vendorActivityPayloadSchema.safeParse({
      ...base,
      incidents: [{ kind: "print_failed", count: -1, lastAt: "2026-10-24T08:00:00.000Z" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts the null plan, status and lastActivityAt a kit may report", () => {
    const result = vendorActivityPayloadSchema.safeParse({
      ...base,
      plan: null,
      status: null,
      lastActivityAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("exposes the six incident kinds", () => {
    expect(INCIDENT_KINDS).toHaveLength(6);
  });
});
