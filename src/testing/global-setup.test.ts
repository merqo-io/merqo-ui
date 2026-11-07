import { afterEach, describe, expect, it, vi } from "vitest";
import { totpCode } from "./totp";
import {
  createAuthenticatedGlobalSetup,
  type SetupBrowser,
} from "./global-setup";

const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

function fakeBrowser() {
  const calls: string[] = [];
  const fills: Record<string, string> = {};
  const loc = (name: string) => ({
    fill: async (v: string) => {
      calls.push(`fill ${name}`);
      fills[name] = v;
    },
    click: async () => void calls.push(`click ${name}`),
    innerText: async () => ` ${SECRET} `,
  });
  const storageState = vi.fn().mockResolvedValue(undefined);
  const page = {
    goto: async (u: string) => void calls.push(`goto ${u}`),
    getByPlaceholder: (t: string) => loc(`placeholder:${t}`),
    getByRole: (_r: "button", o: { name: string }) => loc(`button:${o.name}`),
    getByLabel: (t: string) => loc(`label:${t}`),
    locator: (s: string) => loc(`locator:${s}`),
    waitForURL: async (re: RegExp) => void calls.push(`wait ${re.source}`),
    context: () => ({ storageState }),
  };
  const newContext = vi.fn().mockResolvedValue({ newPage: async () => page });
  const close = vi.fn().mockResolvedValue(undefined);
  const browser = { newContext, close } as unknown as SetupBrowser;
  return { browser, calls, fills, storageState, newContext, close };
}

const config = { projects: [{ use: { baseURL: "http://localhost:3000" } }] };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("createAuthenticatedGlobalSetup", () => {
  it("does nothing unless enabled", async () => {
    vi.stubEnv("MERQO_E2E_AUTH", "");
    const launch = vi.fn();
    await createAuthenticatedGlobalSetup({ stateFile: "s.json", launch })(config);
    expect(launch).not.toHaveBeenCalled();
  });

  it("is enabled by MERQO_E2E_AUTH=1", async () => {
    vi.stubEnv("MERQO_E2E_AUTH", "1");
    const f = fakeBrowser();
    await createAuthenticatedGlobalSetup({
      stateFile: "s.json",
      email: "a@b.test",
      password: "pw",
      launch: async () => f.browser,
    })(config);
    expect(f.storageState).toHaveBeenCalledWith({ path: "s.json" });
  });

  it("signs in, enrols TOTP with the page's secret and saves state", async () => {
    const f = fakeBrowser();
    await createAuthenticatedGlobalSetup({
      stateFile: "e2e/.auth/team.json",
      email: "a@b.test",
      password: "pw",
      enabled: true,
      launch: async () => f.browser,
    })(config);

    expect(f.newContext).toHaveBeenCalledWith({ baseURL: "http://localhost:3000" });
    expect(f.fills["placeholder:you@business.sg"]).toBe("a@b.test");
    expect(f.fills["label:6-digit code"]).toBe(totpCode(SECRET));
    expect(f.calls).toEqual([
      "goto /login",
      "fill placeholder:you@business.sg",
      "fill placeholder:••••••••",
      "click button:Sign in",
      "wait \\/(mfa|admin)",
      "goto /mfa",
      "click button:Set up authenticator",
      "fill label:6-digit code",
      "click button:Verify",
      "wait \\/admin",
    ]);
    expect(f.storageState).toHaveBeenCalledWith({ path: "e2e/.auth/team.json" });
    expect(f.close).toHaveBeenCalled();
  });

  it("uses overridden routes and selectors", async () => {
    const f = fakeBrowser();
    await createAuthenticatedGlobalSetup({
      stateFile: "s.json",
      email: "a@b.test",
      password: "pw",
      enabled: true,
      loginPath: "/sign-in",
      mfaPath: "/verify",
      afterLoginUrl: /\/verify/,
      afterMfaUrl: /\/home/,
      selectors: {
        emailPlaceholder: "mail",
        passwordPlaceholder: "pass",
        signInButton: "Go",
        setupButton: "Enrol",
        secretLocator: "pre",
        codeLabel: "Code",
        verifyButton: "Confirm",
      },
      launch: async () => f.browser,
    })({ projects: [{ use: {} }] });
    expect(f.calls).toContain("goto /sign-in");
    expect(f.calls).toContain("fill placeholder:mail");
    expect(f.calls).toContain("click button:Enrol");
    expect(f.calls).toContain("fill label:Code");
    expect(f.calls).toContain("wait \\/home");
  });

  it("requires credentials and still closes the browser on failure", async () => {
    await expect(
      createAuthenticatedGlobalSetup({ stateFile: "s.json", enabled: true })(config),
    ).rejects.toThrow("email and password");

    const f = fakeBrowser();
    f.newContext.mockRejectedValue(new Error("down"));
    await expect(
      createAuthenticatedGlobalSetup({
        stateFile: "s.json",
        email: "a",
        password: "b",
        enabled: true,
        launch: async () => f.browser,
      })(config),
    ).rejects.toThrow("down");
    expect(f.close).toHaveBeenCalled();
  });

  it("launches Playwright's chromium by default", async () => {
    const f = fakeBrowser();
    vi.resetModules();
    vi.doMock("@playwright/test", () => ({
      chromium: { launch: async () => f.browser },
    }));
    const { createAuthenticatedGlobalSetup: create } = await import("./global-setup");
    await create({ stateFile: "s.json", email: "a", password: "b", enabled: true })(config);
    expect(f.storageState).toHaveBeenCalled();
    vi.doUnmock("@playwright/test");
  });
});
