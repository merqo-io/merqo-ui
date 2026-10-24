import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import type { Linter } from "eslint";

export type MerqoEslintPresetOptions = {
  /** The caller's `eslint-plugin-sonarjs` plugin object, so ESLint sees one instance. */
  sonarjsPlugin: unknown;
  /** The caller's `@typescript-eslint` plugin object. */
  tsPlugin: unknown;
};

const EM_DASH_MESSAGE = "No em dash in user-facing text. Use a period or comma.";
const COLOUR_MESSAGE =
  "Use a colour token (CSS variable or the kit's token module), not a literal.";

const HEX = String.raw`#[0-9a-fA-F]{3,8}\b`;
const COLOUR_FN = String.raw`\b(rgb|rgba|hsl|hsla)\(`;

const colourSelectors = [
  `Literal[value=/${HEX}/]`,
  `Literal[value=/${COLOUR_FN}/]`,
  `TemplateElement[value.raw=/${HEX}/]`,
  `TemplateElement[value.raw=/${COLOUR_FN}/]`,
].map((selector) => ({ selector, message: COLOUR_MESSAGE }));

const emDash = (selector: string) => ({ selector, message: EM_DASH_MESSAGE });

const tsxEmDash = [
  emDash("JSXText[value=/\u2014/]"),
  emDash(
    "JSXAttribute[name.name=/^(aria-label|title|placeholder|label|content|description)$/] > Literal[value=/\u2014/]",
  ),
  emDash("CallExpression[callee.object.name='toast'] Literal[value=/\u2014/]"),
];

const tsEmDash = [
  emDash(
    "Property[key.name=/^(error|message|title|description)$/] > Literal[value=/\u2014/]",
  ),
  emDash("ReturnStatement > Literal[value=/\u2014/]"),
];

const TEST_FILES = [
  "**/*.test.{ts,tsx}",
  "**/*.spec.{ts,tsx}",
  "**/test/**",
  "scripts/**",
  "e2e/**",
];

/**
 * Shared Merqo lint rules: comment hygiene, code-smell limits, colour-token
 * and em-dash bans. Kits add their own `no-use-before-define`, ignores and
 * framework config around it.
 */
export function merqoEslintPreset({
  sonarjsPlugin,
  tsPlugin,
}: MerqoEslintPresetOptions): Linter.Config[] {
  const plugins = {
    sonarjs: sonarjsPlugin,
    "@typescript-eslint": tsPlugin,
    "eslint-comments": eslintComments,
  } as unknown as Linter.Config["plugins"];

  return [
    {
      name: "merqo/linter-options",
      linterOptions: {
        reportUnusedDisableDirectives: "error",
        reportUnusedInlineConfigs: "error",
      },
    },
    {
      name: "merqo/comments-and-smells",
      files: ["**/*.ts", "**/*.tsx"],
      plugins,
      rules: {
        "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
        "eslint-comments/no-aggregating-enable": "error",
        "eslint-comments/no-duplicate-disable": "error",
        "eslint-comments/no-unlimited-disable": "error",
        "eslint-comments/no-unused-enable": "error",
        "eslint-comments/require-description": ["error", { ignore: ["eslint-enable"] }],
        "@typescript-eslint/ban-ts-comment": [
          "error",
          { "ts-expect-error": "allow-with-description" },
        ],
        "no-inline-comments": [
          "error",
          {
            ignorePattern:
              "eslint-|@ts-|prettier-|c8 |istanbul |webpackChunkName",
          },
        ],
        "sonarjs/no-commented-code": "error",
        "sonarjs/todo-tag": "warn",
        "sonarjs/fixme-tag": "warn",
        "max-lines": [
          "error",
          { max: 500, skipBlankLines: true, skipComments: true },
        ],
        complexity: ["error", 15],
        "max-depth": ["error", 4],
        "max-params": ["error", 4],
        "sonarjs/cognitive-complexity": ["error", 15],
        "no-console": ["error", { allow: ["warn", "error"] }],
        eqeqeq: "error",
        "no-else-return": "error",
        "prefer-const": "error",
      },
    },
    {
      name: "merqo/function-length",
      files: ["**/*.ts"],
      rules: {
        "max-lines-per-function": [
          "error",
          { max: 120, skipBlankLines: true, skipComments: true },
        ],
      },
    },
    {
      // JSX composition nests render callbacks past the imperative threshold.
      name: "merqo/tsx-nesting",
      files: ["**/*.tsx"],
      plugins,
      rules: { "sonarjs/no-nested-functions": "off" },
    },
    {
      // One block per file type: later `no-restricted-syntax` blocks replace earlier ones.
      name: "merqo/tokens-and-copy-tsx",
      files: ["src/**/*.tsx"],
      ignores: TEST_FILES,
      rules: {
        "no-restricted-syntax": ["error", ...colourSelectors, ...tsxEmDash],
      },
    },
    {
      name: "merqo/tokens-and-copy-ts",
      files: ["src/**/*.ts"],
      ignores: TEST_FILES,
      rules: {
        "no-restricted-syntax": ["error", ...colourSelectors, ...tsEmDash],
      },
    },
    {
      // Fixtures carry short trailing notes, nested mocks and fake values.
      name: "merqo/tests-and-scripts",
      files: TEST_FILES,
      plugins,
      rules: {
        "no-inline-comments": "off",
        "max-lines": "off",
        "max-lines-per-function": "off",
        "sonarjs/no-nested-functions": "off",
        "sonarjs/no-hardcoded-passwords": "off",
        "sonarjs/no-hardcoded-ip": "off",
        "sonarjs/no-clear-text-protocols": "off",
        "sonarjs/no-hardcoded-secrets": "off",
        "sonarjs/pseudo-random": "off",
      },
    },
  ];
}
