import { describe, it, expect } from "vitest";
import { ESLint, type Linter } from "eslint";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";
import { merqoEslintPreset } from "./preset";

const sonarjsPlugin = (
  sonarjs as unknown as { configs: { recommended: { plugins: { sonarjs: unknown } } } }
).configs.recommended.plugins.sonarjs;

const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: true,
  overrideConfig: [
    tseslint.configs.base as Linter.Config,
    ...merqoEslintPreset({
      sonarjsPlugin,
      tsPlugin: tseslint.plugin,
    }),
  ],
});

async function lint(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages;
}

const byRule = (messages: Awaited<ReturnType<typeof lint>>, ruleId: string) =>
  messages.filter((m) => m.ruleId === ruleId);

describe("merqoEslintPreset", () => {
  it("rejects a hex colour literal", async () => {
    const messages = await lint('export const c = "#ff0000";\n', "src/a.ts");
    expect(byRule(messages, "no-restricted-syntax")[0]?.message).toContain("colour token");
  });

  it("rejects an rgb() colour inside a template literal", async () => {
    const messages = await lint("export const c = `rgb(1, 2, 3)`;\n", "src/a.ts");
    expect(byRule(messages, "no-restricted-syntax")[0]?.message).toContain("colour token");
  });

  it("rejects a trailing inline comment", async () => {
    const messages = await lint("export const x = 1; // note\n", "src/a.ts");
    expect(byRule(messages, "no-inline-comments")).toHaveLength(1);
  });

  it("requires a reason on an eslint-disable directive", async () => {
    const code = "// eslint-disable-next-line no-console\nconsole.log(1);\n";
    const messages = await lint(code, "src/a.ts");
    expect(byRule(messages, "eslint-comments/require-description")).toHaveLength(1);
  });

  it("rejects a file over 500 lines", async () => {
    const messages = await lint("a();\n".repeat(501), "src/a.ts");
    expect(byRule(messages, "max-lines")).toHaveLength(1);
  });

  it("rejects an em dash in JSX text", async () => {
    const messages = await lint("export const a = <p>a \u2014 b</p>;\n", "src/a.tsx");
    expect(byRule(messages, "no-restricted-syntax")[0]?.message).toContain("em dash");
  });

  it("rejects an em dash in a returned string from a .ts file", async () => {
    const code = "export function f() {\n  return \"a \u2014 b\";\n}\n";
    const messages = await lint(code, "src/a.ts");
    expect(byRule(messages, "no-restricted-syntax")[0]?.message).toContain("em dash");
  });

  it("reports a clean file as clean", async () => {
    const messages = await lint("export const x = 1;\n", "src/a.ts");
    expect(messages).toEqual([]);
  });

  it("relaxes inline comments and colour literals in test files", async () => {
    const code = 'export const x = "#ff0000"; // fixture\n';
    const messages = await lint(code, "src/a.test.ts");
    expect(messages).toEqual([]);
  });
});
