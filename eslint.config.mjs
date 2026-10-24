import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import { merqoEslintPreset } from "./src/eslint/preset.ts";

export default defineConfig(
  { ignores: ["dist/**", "coverage/**", "node_modules/**", "**/*.generated.*"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { console: "readonly", process: "readonly", Buffer: "readonly", URL: "readonly" } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended, reactHooks.configs.flat.recommended, sonarjs.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "sonarjs/no-unused-vars": "off",
    },
  },
  ...merqoEslintPreset({
    sonarjsPlugin: sonarjs.configs.recommended.plugins.sonarjs,
    tsPlugin: tseslint.plugin,
  }),
  {
    // Google brand mark colours are fixed by the brand guidelines.
    files: ["src/google-mark.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "src/test-setup.ts"],
    languageOptions: { globals: { describe: "readonly", it: "readonly", test: "readonly", expect: "readonly", beforeEach: "readonly", afterEach: "readonly", beforeAll: "readonly", afterAll: "readonly", vi: "readonly" } },
    rules: { "no-inline-comments": "off" },
  },
);
