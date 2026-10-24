import { describe, it, expect } from "vitest";
import { renderSmoke, type SmokePage } from "./render-smoke";

type FakeRoute = {
  status?: number;
  boundary?: boolean;
  pageError?: string;
  consoleError?: string;
};

function fakePage(routes: Record<string, FakeRoute>): SmokePage {
  const handlers: Record<string, ((arg: never) => void)[]> = {};
  let current = "";
  return {
    on(event: string, handler: (arg: never) => void) {
      handlers[event] = [...(handlers[event] ?? []), handler];
    },
    async goto(url: string) {
      current = url;
      const route = routes[url] ?? {};
      if (route.pageError) {
        for (const h of handlers.pageerror ?? []) h(new Error(route.pageError) as never);
      }
      if (route.consoleError) {
        const message = { type: () => "error", text: () => route.consoleError } as never;
        for (const h of handlers.console ?? []) h(message);
      }
      return { status: () => route.status ?? 200 };
    },
    locator() {
      return { count: async () => (routes[current]?.boundary ? 1 : 0) };
    },
  };
}

describe("renderSmoke", () => {
  it("returns no failures for healthy routes", async () => {
    const failures = await renderSmoke(fakePage({}), ["/a", "/b"]);
    expect(failures).toEqual([]);
  });

  it("reports a 5xx response", async () => {
    const failures = await renderSmoke(fakePage({ "/a": { status: 503 } }), ["/a"]);
    expect(failures).toEqual([{ route: "/a", reason: "status 503" }]);
  });

  it("reports an error boundary", async () => {
    const failures = await renderSmoke(fakePage({ "/a": { boundary: true } }), ["/a"]);
    expect(failures).toEqual([{ route: "/a", reason: "error boundary rendered" }]);
  });

  it("reports an uncaught page error", async () => {
    const failures = await renderSmoke(fakePage({ "/a": { pageError: "boom" } }), ["/a"]);
    expect(failures).toEqual([{ route: "/a", reason: "pageerror: boom" }]);
  });

  it("reports a CSP violation logged to the console", async () => {
    const text = "Refused to execute inline script because it violates the following Content Security Policy directive";
    const failures = await renderSmoke(fakePage({ "/a": { consoleError: text } }), ["/a"]);
    expect(failures).toEqual([{ route: "/a", reason: `csp violation: ${text}` }]);
  });

  it("ignores console errors that are not CSP violations", async () => {
    const failures = await renderSmoke(fakePage({ "/a": { consoleError: "favicon 404" } }), ["/a"]);
    expect(failures).toEqual([]);
  });

  it("attributes failures to the route that caused them", async () => {
    const failures = await renderSmoke(
      fakePage({ "/a": {}, "/b": { status: 500 } }),
      ["/a", "/b"],
    );
    expect(failures.map((f) => f.route)).toEqual(["/b"]);
  });
});
