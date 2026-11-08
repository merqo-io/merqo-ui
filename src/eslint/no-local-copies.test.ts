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
    ['import { PageHeader } from "./page-header";', "PageHeader"],
    ['import { SegmentedControl } from "@/components/widgets/segmented-control";', "SegmentedControl"],
    ['import { Label } from "@/components/ui/label";', "@merqo/ui/primitives"],
    ['import { cn } from "@/lib/utils";', "cn"],
    ['import { createClient } from "@/lib/supabase/server";', "@merqo/ui/supabase/server"],
    ['import { themeProps } from "@/lib/theme-props";', "@merqo/ui/next"],
    ['import { rateLimit } from "@/lib/rate-limit";', "@merqo/ui/kit-api"],
    ['import { checkLegalAcceptance } from "@/lib/legal-gate";', "@merqo/ui/auth"],
    ['import { SiteFooter } from "@/components/site-footer";', "Footer"],
    ['import { Section } from "@/components/section";', "Section"],
    ['export { x } from "./use-async-action";', "useAsyncAction"],
    ['const m = await import("@/lib/brand-icon");', "brandIcon"],
    ['import { VendorTelegramConnect } from "./vendor-telegram-connect";', "onConnect"],
    ['import { formatSgd } from "@/lib/money";', "formatMoney"],
    ['import { MfaForm } from "@/app/mfa/mfa-form.tsx";', "MfaForm"],
  ])("flags %s", async (code, replacement) => {
    const messages = await lint(`${code}\n`);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain(replacement);
  });

  it("flags a file that defines a local copy", async () => {
    const messages = await lint("export const x = 1;\n", "src/hooks/use-async-action.ts");
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("useAsyncAction");
  });

  it("does not flag shared imports", async () => {
    const code = [
      'import { useAsyncAction, PageHeader } from "@merqo/ui";',
      'import { Button } from "@merqo/ui/primitives";',
      'import { createClient } from "@merqo/ui/supabase/server";',
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
      'import { Hero } from "react";',
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
    const allowed = makeLint({ allow: ["footer"] });
    expect(await allowed('import { F } from "@/components/site-footer";\n')).toHaveLength(0);
    expect(await allowed("export {};\n", "src/components/landing/footer.tsx")).toHaveLength(0);
    expect(await allowed('import { x } from "@/hooks/use-async-action";\n')).toHaveLength(1);
  });

  it("skips an allow-listed path suffix only for that path", async () => {
    const allowed = makeLint({ allow: ["components/landing/footer"] });
    expect(await allowed('import { F } from "@/components/landing/footer";\n')).toHaveLength(0);
    expect(await allowed('import { F } from "@/components/other/footer";\n')).toHaveLength(1);
    expect(await allowed("export {};\n", "src/components/landing/footer.tsx")).toHaveLength(0);
  });

  it("has a unique id and a replacement mentioning @merqo/ui for every piece", () => {
    const ids = SHARED_PIECES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of SHARED_PIECES) expect(piece.replacement).toContain("@merqo/ui");
  });
});
