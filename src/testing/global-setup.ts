import { totpCode } from "./totp";

type SetupLocator = {
  fill(value: string): Promise<unknown>;
  click(): Promise<unknown>;
  innerText(): Promise<string>;
};

/** The slice of Playwright's `Page` the sign-in and MFA enrolment flow uses. */
export type SetupPage = {
  goto(url: string): Promise<unknown>;
  getByPlaceholder(text: string): SetupLocator;
  getByRole(role: "button", options: { name: string }): SetupLocator;
  getByLabel(text: string): SetupLocator;
  locator(selector: string): SetupLocator;
  waitForURL(url: RegExp): Promise<unknown>;
  context(): { storageState(options: { path: string }): Promise<unknown> };
};

export type SetupBrowser = {
  newContext(options: { baseURL?: string }): Promise<{
    newPage(): Promise<SetupPage>;
  }>;
  close(): Promise<unknown>;
};

/** The slice of Playwright's `FullConfig` the setup reads. */
export type SetupConfig = {
  projects: { use: { baseURL?: string } }[];
};

export type AuthenticatedStateOptions = {
  /** Where the aal2 `storageState` JSON is written, relative to the cwd. */
  stateFile: string;
  /** Sign-in account. Required unless `enabled` is false. */
  email?: string;
  password?: string;
  /** Skips the whole setup when false. Defaults to `MERQO_E2E_AUTH === "1"`. */
  enabled?: boolean;
  loginPath?: string;
  mfaPath?: string;
  /** Page text and routes the kit renders; defaults match `LoginForm` and `MfaForm`. */
  selectors?: {
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    signInButton?: string;
    setupButton?: string;
    secretLocator?: string;
    codeLabel?: string;
    verifyButton?: string;
  };
  /** URL pattern reached after the password step. */
  afterLoginUrl?: RegExp;
  /** URL pattern reached once MFA is verified. */
  afterMfaUrl?: RegExp;
  /** Launches the browser. Defaults to Playwright's chromium. */
  launch?: () => Promise<SetupBrowser>;
};

async function launchChromium(): Promise<SetupBrowser> {
  // Optional peer: only e2e runs (which have Playwright) ever reach this.
  const { chromium } = await import("@playwright/test");
  return (await chromium.launch()) as unknown as SetupBrowser;
}

const DEFAULT_SELECTORS = {
  emailPlaceholder: "you@business.sg",
  passwordPlaceholder: "••••••••",
  signInButton: "Sign in",
  setupButton: "Set up authenticator",
  secretLocator: "code",
  codeLabel: "6-digit code",
  verifyButton: "Verify",
};

async function signIn(
  page: SetupPage,
  options: AuthenticatedStateOptions,
  s: typeof DEFAULT_SELECTORS,
): Promise<void> {
  await page.goto(options.loginPath ?? "/login");
  await page.getByPlaceholder(s.emailPlaceholder).fill(options.email ?? "");
  await page
    .getByPlaceholder(s.passwordPlaceholder)
    .fill(options.password ?? "");
  await page.getByRole("button", { name: s.signInButton }).click();
  await page.waitForURL(options.afterLoginUrl ?? /\/(mfa|admin)/);
}

async function enrolAuthenticator(
  page: SetupPage,
  options: AuthenticatedStateOptions,
  s: typeof DEFAULT_SELECTORS,
): Promise<void> {
  await page.goto(options.mfaPath ?? "/mfa");
  await page.getByRole("button", { name: s.setupButton }).click();
  const secret = (await page.locator(s.secretLocator).innerText()).trim();
  await page.getByLabel(s.codeLabel).fill(totpCode(secret));
  await page.getByRole("button", { name: s.verifyButton }).click();
  await page.waitForURL(options.afterMfaUrl ?? /\/admin/);
}

/**
 * Builds a Playwright `globalSetup` that signs a seeded account in once,
 * enrols an authenticator through the real MFA page and saves the aal2
 * session for every authenticated test to reuse.
 */
export function createAuthenticatedGlobalSetup(
  options: AuthenticatedStateOptions,
): (config: SetupConfig) => Promise<void> {
  return async (config) => {
    const enabled = options.enabled ?? process.env.MERQO_E2E_AUTH === "1";
    if (!enabled) return;
    if (!options.email || !options.password) {
      throw new Error("createAuthenticatedGlobalSetup needs email and password");
    }
    const s = { ...DEFAULT_SELECTORS, ...options.selectors };
    const browser = await (options.launch ?? launchChromium)();
    try {
      const baseURL = config.projects[0]?.use.baseURL;
      const page = await (await browser.newContext({ baseURL })).newPage();
      await signIn(page, options, s);
      await enrolAuthenticator(page, options, s);
      await page.context().storageState({ path: options.stateFile });
    } finally {
      await browser.close();
    }
  };
}
