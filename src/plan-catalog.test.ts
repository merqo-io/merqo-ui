import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlanCatalog, formatCatalogPrice } from "./plan-catalog";

const FIXTURE = {
  plans: [
    { slug: "free", kind: "free", name: "Free", monthly_cents: 0, annual_cents: 0, kits: [] },
    { slug: "starter", kind: "bundle", name: "Starter", monthly_cents: 1200, annual_cents: 12000, kits: ["qkit"] },
    { slug: "qkit", kind: "kit", name: "qkit", monthly_cents: 1600, annual_cents: 16000, kits: ["qkit"] },
    { slug: "all_access", kind: "bundle", name: "All-Access", monthly_cents: 3600, annual_cents: 36000, kits: ["qkit", "loopkit"] },
  ],
  event_pass: { per_cup_cents: 15, min_cents: 1400, cap_cents: 2800, days: 2 },
};

function stubFetch(impl: () => unknown) {
  const fn = vi.fn((..._args: unknown[]) => impl());
  vi.stubGlobal("fetch", fn);
  return fn;
}

const ok = (body: unknown) => () =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

afterEach(() => vi.unstubAllGlobals());

describe("fetchPlanCatalog", () => {
  it("returns the parsed catalog and ignores unknown keys", async () => {
    const fn = stubFetch(ok({ ...FIXTURE, extra: 1 }));
    const result = await fetchPlanCatalog("https://merqo.test");
    expect(result).toEqual(FIXTURE);
    expect(fn.mock.calls[0]![0]).toBe("https://merqo.test/api/plans");
  });

  it("strips trailing slashes from the base url", async () => {
    const fn = stubFetch(ok(FIXTURE));
    await fetchPlanCatalog("https://merqo.test//");
    expect(fn.mock.calls[0]![0]).toBe("https://merqo.test/api/plans");
  });

  it("uses revalidate and a timeout by default; caller init overrides", async () => {
    const fn = stubFetch(ok(FIXTURE));
    await fetchPlanCatalog("https://merqo.test");
    const first = fn.mock.calls[0]![1] as Record<string, unknown>;
    expect(first.next).toEqual({ revalidate: 300 });
    expect(first.signal).toBeInstanceOf(AbortSignal);
    await fetchPlanCatalog("https://merqo.test", { cache: "no-store" });
    const second = fn.mock.calls[1]![1] as Record<string, unknown>;
    expect(second.cache).toBe("no-store");
  });

  it("returns null on a non-2xx response", async () => {
    stubFetch(() => Promise.resolve(new Response("{}", { status: 500 })));
    expect(await fetchPlanCatalog("https://merqo.test")).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    stubFetch(() => Promise.reject(new TypeError("offline")));
    expect(await fetchPlanCatalog("https://merqo.test")).toBeNull();
  });

  it("returns null on invalid JSON", async () => {
    stubFetch(() => Promise.resolve(new Response("not json", { status: 200 })));
    expect(await fetchPlanCatalog("https://merqo.test")).toBeNull();
  });

  it.each([
    ["missing event_pass", { plans: FIXTURE.plans }],
    ["fractional cents", { ...FIXTURE, plans: [{ ...FIXTURE.plans[1], monthly_cents: 12.5 }] }],
    ["negative cents", { ...FIXTURE, event_pass: { ...FIXTURE.event_pass, min_cents: -1 } }],
    ["zero days", { ...FIXTURE, event_pass: { ...FIXTURE.event_pass, days: 0 } }],
  ])("returns null on schema mismatch: %s", async (_name, body) => {
    stubFetch(ok(body));
    expect(await fetchPlanCatalog("https://merqo.test")).toBeNull();
  });
});

describe("formatCatalogPrice", () => {
  it.each([
    [1600, "S$16"],
    [1333, "S$13.33"],
    [15, "15c"],
    [0, "S$0"],
    [36000, "S$360"],
  ])("formats %i as %s", (value, expected) => {
    expect(formatCatalogPrice(value)).toBe(expected);
  });
});
