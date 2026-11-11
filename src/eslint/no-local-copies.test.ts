import { describe, it, expect } from "vitest";
import { ESLint, type Linter } from "eslint";
import tseslint from "typescript-eslint";
import { merqoNoLocalCopies, type MerqoNoLocalCopiesOptions } from "./index";
import { SHARED_PIECES } from "./local-copies";

function makeLint(options?: MerqoNoLocalCopiesOptions) {
  const eslint = new ESLint({
    cwd: process.cwd(),
    overrideConfigFile: true,
    overrideConfig: [tseslint.configs.base as Linter.Config, ...merqoNoLocalCopies(options)],
  });
  return async (code: string, filePath = "src/app/page.tsx") => {
    const [result] = await eslint.lintText(code, { filePath });
    return result.messages.filter((m) => m.ruleId === "merqo/no-local-copy");
  };
}

const lint = makeLint();

describe("merqoNoLocalCopies", () => {
  it.each([
    ['import { useAsyncAction } from "@/hooks/use-async-action";', "useAsyncAction"],
    ['import { tierLabel } from "../lib/tier-label";', "tierLabel"],
    ['import { PageHeader } from "@/components/page-header";', "PageHeader"],
    ['import { PageHeader } from "../components/widgets/page-header";', "PageHeader"],
    ['import { SegmentedControl } from "@/components/widgets/segmented-control";', "SegmentedControl"],
    ['import { Label } from "@/components/ui/label";', "@merqo/ui/primitives"],
    ['import { Button } from "../ui/button";', "@merqo/ui/primitives"],
    ['import { Dialog } from "./ui/dialog";', "@merqo/ui/primitives"],
    ['import { createClient } from "@/lib/supabase/server";', "createSupabaseServerClient"],
    ['import { updateSession } from "@/lib/supabase/middleware";', "updateSupabaseSession"],
    ['import { themeProps } from "@/lib/theme-props";', "@merqo/ui/next"],
    ['import { rateLimit } from "@/lib/rate-limit";', "@merqo/ui/kit-api"],
    ['import { checkLegalAcceptance } from "@/lib/legal-gate";', "@merqo/ui/auth"],
    ['export { x } from "@/hooks/use-async-action";', "useAsyncAction"],
    ['const m = await import("@/lib/brand-icon");', "brandIcon"],
    ['import { C } from "@/app/profile/vendor-telegram-connect";', "onConnect"],
    ['import { MfaForm } from "@/app/mfa/mfa-form.tsx";', "MfaForm"],
    ['import { Row } from "@/components/dashboard/stat-card/index";', "StatCard"],
  ])("flags %s", async (code, replacement) => {
    const messages = await lint(`${code}\n`);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain(replacement);
    expect(messages[0].message).toContain("add it to `allow` if it wraps the shared piece");
  });

  it("flags a file that defines a local copy", async () => {
    const messages = await lint("export const x = 1;\n", "src/hooks/use-async-action.ts");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("useAsyncAction");
  });

  it("strips a trailing index from file paths and specifiers", async () => {
    expect(await lint("export const x = 1;\n", "src/components/page-header/index.tsx")).toHaveLength(1);
    expect(await lint('import { P } from "@/components/page-header/index";\n')).toHaveLength(1);
    const cn = await lint('import { cn } from "@/lib/utils/index";\n');
    expect(cn).toHaveLength(1);
  });

  it("skips a file definition when the file imports from @merqo/ui", async () => {
    const wrapper = 'import { PageHeader } from "@merqo/ui";\nexport const X = PageHeader;\n';
    expect(await lint(wrapper, "src/components/page-header.tsx")).toHaveLength(0);
    const sub = 'import { themeProps } from "@merqo/ui/next";\nexport const t = themeProps;\n';
    expect(await lint(sub, "src/lib/theme-props.ts")).toHaveLength(0);
    expect(await lint("export {};\n", "src/lib/theme-props.ts")).toHaveLength(1);
  });

  it("still flags an import of a wrapper file", async () => {
    expect(await lint('import { P } from "@/components/page-header";\n')).toHaveLength(1);
  });

  describe("cn", () => {
    it("flags an import naming cn with the cn message", async () => {
      const [message] = await lint('import { cn, other } from "@/lib/utils";\n');
      expect(message.message).toBe(
        "Import cn from @merqo/ui/primitives and keep the other helpers local, or add it to `allow` if it wraps the shared piece.",
      );
      expect(await lint('import { cn as c } from "../lib/utils";\n')).toHaveLength(1);
      expect(await lint('export { cn } from "./lib/utils";\n')).toHaveLength(1);
    });

    it("does not flag other names, a dynamic import or the file itself", async () => {
      expect(await lint('import { formatThing } from "@/lib/utils";\n')).toHaveLength(0);
      expect(await lint('const m = await import("@/lib/utils");\n')).toHaveLength(0);
      expect(await lint("export function cn() {}\n", "src/lib/utils.ts")).toHaveLength(0);
    });
  });

  describe("primitives shipped from @merqo/ui/primitives", () => {
    it.each([
      ["alert-dialog", "AlertDialog"],
      ["popover", "Popover"],
      ["sheet", "Sheet"],
      ["dropdown-menu", "DropdownMenu"],
      ["toggle", "Toggle"],
      ["toggle-group", "ToggleGroup"],
      ["skeleton", "Skeleton"],
    ])("flags a local %s copy and accepts its id in allow", async (id, name) => {
      const code = `import { ${name} } from "@/components/ui/${id}";\n`;
      const [message] = await lint(code);
      expect(message.message).toContain(`import { ${name}`);
      expect(message.message).toContain("@merqo/ui/primitives");
      expect(await lint("export {};\n", `src/components/ui/${id}.tsx`)).toHaveLength(1);
      const allowed = makeLint({ allow: [id] });
      expect(await allowed(code)).toHaveLength(0);
      expect(await allowed("export {};\n", `src/components/ui/${id}.tsx`)).toHaveLength(0);
    });

    it("does not confuse toggle with toggle-group", async () => {
      const [message] = await lint('import { ToggleGroup } from "@/components/ui/toggle-group";\n');
      expect(message.message).toContain("ToggleGroup");
    });
  });

  describe("form class constants", () => {
    it("flags FORM_LABEL_CLASS and FORM_ERROR_CLASS imported from lib/utils", async () => {
      for (const name of ["FORM_LABEL_CLASS", "FORM_ERROR_CLASS"]) {
        const [message] = await lint(`import { ${name} } from "@/lib/utils";\n`);
        expect(message.message).toContain(
          'import { FORM_LABEL_CLASS, FORM_ERROR_CLASS } from "@merqo/ui"',
        );
      }
      expect(await lint('import { FORM_ERROR_CLASS } from "../lib/utils/index";\n')).toHaveLength(1);
      expect(await lint('export { FORM_LABEL_CLASS } from "./lib/utils";\n')).toHaveLength(1);
    });

    it("leaves other names and the defining file alone, and honours allow", async () => {
      expect(await lint('import { formatThing } from "@/lib/utils";\n')).toHaveLength(0);
      expect(await lint('export const FORM_ERROR_CLASS = "x";\n', "src/lib/utils.ts")).toHaveLength(0);
      const allowed = makeLint({ allow: ["form-classes"] });
      expect(await allowed('import { FORM_LABEL_CLASS } from "@/lib/utils";\n')).toHaveLength(0);
    });

    it("reports a form constant imported beside cn", async () => {
      expect(await lint('import { cn, FORM_LABEL_CLASS } from "@/lib/utils";\n')).toHaveLength(1);
    });
  });

  describe("error pages", () => {
    const only =
      'import { ElevatedCard } from "@merqo/ui";\nexport default function P() { return ElevatedCard; }\n';
    it.each([
      ["error-page", "ErrorPage", "src/app/error.tsx"],
      ["global-error-page", "GlobalError", "src/app/global-error.tsx"],
      ["not-found-page", "NotFound", "app/not-found.tsx"],
      ["error-page", "ErrorPage", "src/app/(auth)/dashboard/error.tsx"],
    ])("requires %s to render %s in %s", async (id, name, file) => {
      const [message] = await lint(only, file);
      expect(message.message).toContain(name);
      const good = `import { ${name} } from "@merqo/ui";\nexport default ${name};\n`;
      expect(await lint(good, file)).toHaveLength(0);
      expect(await makeLint({ allow: [id] })(only, file)).toHaveLength(0);
    });

    it("flags a page that imports nothing from @merqo/ui", async () => {
      expect(await lint("export default function E() { return null; }\n", "src/app/error.tsx")).toHaveLength(1);
    });

    it("accepts the required export from a subpath", async () => {
      const code = 'import { ErrorPage } from "@merqo/ui/next";\nexport default ErrorPage;\n';
      expect(await lint(code, "src/app/error.tsx")).toHaveLength(0);
    });

    it("skips app/dev, re-export-only files, other folders and imports of the files", async () => {
      expect(await lint(only, "src/app/dev/error.tsx")).toHaveLength(0);
      expect(await lint('export { default } from "../error";\n', "src/app/dashboard/error.tsx")).toHaveLength(0);
      expect(await lint(only, "src/components/error.tsx")).toHaveLength(0);
      expect(await lint(only, "src/app/error.test.tsx")).toHaveLength(0);
      expect(await lint('import E from "@/app/error";\n')).toHaveLength(0);
    });
  });

  it("does not flag shared imports", async () => {
    const code = [
      'import { useAsyncAction, PageHeader } from "@merqo/ui";',
      'import { Button } from "@merqo/ui/primitives";',
      'import { createSupabaseServerClient } from "@merqo/ui/supabase/server";',
    ].join("\n");
    expect(await lint(`${code}\n`)).toHaveLength(0);
  });

  it("does not flag the pieces a kit keeps local", async () => {
    const code = [
      'import { Wordmark } from "@/components/landing/wordmark";',
      'import { HelpCentre } from "@/components/help/help-centre";',
      'import { OrderStatusBadge } from "@/components/board/order-status-badge";',
      'import { AdminPageHeader } from "./admin-page-header";',
      'import { FAQ_ITEMS } from "@/components/landing/faq";',
      'import { STEPS } from "@/components/tour/steps";',
      'import { SCHEDULES } from "@/lib/legal-schedules";',
      'import { Calendar } from "@/components/ui/calendar";',
      'import { SiteFooter } from "@/components/site-footer";',
      'import { Providers } from "@/components/providers";',
      'import { Section } from "@/components/section";',
      'import { formatSgd } from "@/lib/money";',
      'import { PageHeader } from "./page-header";',
      'import { x } from "@/features/page-header";',
    ].join("\n");
    expect(await lint(`${code}\n`)).toHaveLength(0);
  });

  it("does not flag a dynamic import with a computed source", async () => {
    expect(await lint("const m = await import(name);\n")).toHaveLength(0);
  });

  it("does not flag a test file next to a shared-named module", async () => {
    expect(await lint("export {};\n", "src/hooks/use-async-action.test.ts")).toHaveLength(0);
  });

  it("skips an allow-listed piece id for imports and definitions", async () => {
    const allowed = makeLint({ allow: ["Page-Header"] });
    expect(await allowed('import { P } from "@/components/page-header";\n')).toHaveLength(0);
    expect(await allowed("export {};\n", "src/components/page-header.tsx")).toHaveLength(0);
    expect(await allowed('import { x } from "@/hooks/use-async-action";\n')).toHaveLength(1);
  });

  it("matches an allow path suffix ignoring prefixes, extension and case", async () => {
    const allowed = makeLint({ allow: ["@/Components/Widgets/Page-Header.tsx"] });
    expect(await allowed('import { P } from "@/components/widgets/page-header";\n')).toHaveLength(0);
    expect(await allowed('import { P } from "@/components/page-header";\n')).toHaveLength(1);
    expect(await allowed("export {};\n", "src/components/widgets/page-header.tsx")).toHaveLength(0);
    const relative = makeLint({ allow: ["./lib/rate-limit.ts", "src/lib/legal-gate"] });
    expect(await relative('import { r } from "@/lib/rate-limit";\n')).toHaveLength(0);
    expect(await relative('import { r } from "@/lib/legal-gate";\n')).toHaveLength(0);
  });

  it("has a unique id and a replacement mentioning @merqo/ui for every piece", () => {
    const ids = SHARED_PIECES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of SHARED_PIECES) {
      expect(piece.replacement).toContain("@merqo/ui");
      expect(piece.replacement).not.toContain("...");
    }
  });
});
