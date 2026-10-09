import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";

export default defineConfig(
  { ignores: ["dist/**", "coverage/**", "node_modules/**", "**/*.generated.*"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { console: "readonly", process: "readonly", Buffer: "readonly", URL: "readonly" } },
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended, reactHooks.configs.flat.recommended, sonarjs.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "sonarjs/no-unused-vars": "off",
      "sonarjs/no-commented-code": "error",
      "no-inline-comments": ["error", { ignorePattern: "eslint-|@ts-|prettier-|c8 |istanbul " }],
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      // JSX composition routinely nests render callbacks.
      "sonarjs/no-nested-functions": "off",
    },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "src/test-setup.ts"],
    languageOptions: { globals: { describe: "readonly", it: "readonly", test: "readonly", expect: "readonly", beforeEach: "readonly", afterEach: "readonly", beforeAll: "readonly", afterAll: "readonly", vi: "readonly" } },
    rules: {
      // Fixture annotations and fake network values are deliberate test inputs.
      "no-inline-comments": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-hardcoded-passwords": "off",
      "sonarjs/no-hardcoded-ip": "off",
      "sonarjs/no-clear-text-protocols": "off",
      "sonarjs/pseudo-random": "off",
    },
  },
);
