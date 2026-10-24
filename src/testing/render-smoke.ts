export type SmokeFailure = { route: string; reason: string };

type SmokeResponse = { status(): number } | null;

type SmokeConsoleMessage = { type(): string; text(): string };

/** The slice of Playwright's `Page` that `renderSmoke` uses. */
export type SmokePage = {
  on(event: "pageerror", handler: (error: Error) => void): unknown;
  on(event: "console", handler: (message: SmokeConsoleMessage) => void): unknown;
  goto(url: string): Promise<SmokeResponse>;
  locator(selector: string): { count(): Promise<number> };
};

export type RenderSmokeOptions = {
  /** Selector present only while an error boundary is on screen. */
  errorBoundarySelector?: string;
};

const DEFAULT_ERROR_BOUNDARY = '[data-error-boundary="true"]';
const CSP_VIOLATION = /Content Security Policy/i;

/**
 * Visits each route with an already signed-in page and returns what broke:
 * a 5xx, an error boundary, an uncaught page error or a CSP violation.
 * An empty array means every route rendered.
 */
export async function renderSmoke(
  page: SmokePage,
  routes: string[],
  { errorBoundarySelector = DEFAULT_ERROR_BOUNDARY }: RenderSmokeOptions = {},
): Promise<SmokeFailure[]> {
  const failures: SmokeFailure[] = [];
  let route = "";
  const fail = (reason: string) => failures.push({ route, reason });

  page.on("pageerror", (error) => fail(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && CSP_VIOLATION.test(message.text())) {
      fail(`csp violation: ${message.text()}`);
    }
  });

  for (const target of routes) {
    route = target;
    const response = await page.goto(target);
    const status = response?.status() ?? 0;
    if (status >= 500) fail(`status ${status}`);
    if ((await page.locator(errorBoundarySelector).count()) > 0) {
      fail("error boundary rendered");
    }
  }
  return failures;
}
