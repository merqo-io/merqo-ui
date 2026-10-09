import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: false,
  test: {
    coverage: { provider: "v8", thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }, include: ["src/**/*.ts", "src/**/*.tsx"], exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.d.ts", "src/test-setup.ts"], reporter: ["text", "json-summary", "lcov"] },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    // The barrel `./index` keeps growing (icon libraries, qrcode, etc.) and
    // every component's own "is exported from the package root" test does a
    // cold `await import("./index")` — that first import can now take
    // several seconds under jsdom, well past vitest's 5s default.
    testTimeout: 30000,
  },
});
