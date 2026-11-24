import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const PORT = 5199;
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  testDir: here("."),
  testMatch: "render.spec.ts",
  outputDir: here(".screenshots/results"),
  reporter: "list",
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: "pnpm preview",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: "phone-360",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true },
    },
    {
      name: "desktop-1280",
      grepInvert: /touch targets/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
