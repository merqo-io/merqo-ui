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
      'import { AlertDialog } from "@/components/ui/alert-dialog";',
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
