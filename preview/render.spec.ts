import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const SHOTS = fileURLToPath(new URL("./.screenshots/", import.meta.url));
const MIN_TOUCH_HEIGHT = 44;

// Real defects found by the render check, parked until the component is fixed.
// Each entry matches a group heading and the control's accessible label (or
// text). Remove an entry when its component is fixed; the run reports entries
// that no longer fail so the list cannot rot.
interface KnownIssue {
  group: string;
  label: RegExp;
  reason: string;
}
function knownTapIssues(): KnownIssue[] {
  return [];
}

// Inline text links inside running copy are exempt from the 44px rule: the
// line box, not the link, sets their height, and WCAG allows inline targets.
const INLINE_LINK = "p a, li a, label a, [data-inline-link]";

function viewportName(testInfo: { project: { name: string } }) {
  return testInfo.project.name;
}

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-group]").first().waitFor();
});

test("no horizontal overflow", async ({ page }) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const offenders: string[] = [];
    if (doc.scrollWidth > doc.clientWidth) {
      for (const group of document.querySelectorAll<HTMLElement>("[data-group]")) {
        if (group.scrollWidth > group.clientWidth) offenders.push(group.dataset.group ?? "?");
      }
      if (offenders.length === 0) offenders.push("(page chrome)");
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow in: ${overflow.offenders.join(", ")}`,
  ).toBeLessThanOrEqual(overflow.clientWidth);
});

interface SmallTarget {
  group: string;
  label: string;
  height: number;
  width: number;
}

function findSmallTargets(page: Page): Promise<SmallTarget[]> {
  return page.evaluate(
    ({ min, inline }) => {
      const selector = "button, a[href], input, textarea, select, [role=radio], [role=tab], [role=menuitem]";
      const out: SmallTarget[] = [];
      const isVisible = (el: HTMLElement) => {
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0;
      };
      for (const el of document.querySelectorAll<HTMLElement>(`#preview-root ${selector}`)) {
        if (el.matches(inline)) continue;
        if (!isVisible(el)) continue;
        const box = el.getBoundingClientRect();
        // A pseudo-element hit area (the tooltip trigger's after:size-11)
        // makes the control tappable beyond its painted box.
        const after = getComputedStyle(el, "::after");
        const hitHeight = after.position === "absolute" ? Number.parseFloat(after.height) || 0 : 0;
        if (Math.max(box.height, hitHeight) >= min) continue;
        const label =
          el.getAttribute("aria-label") ??
          (el.textContent?.trim() || el.getAttribute("placeholder") || el.tagName.toLowerCase());
        out.push({
          group: el.closest<HTMLElement>("[data-group]")?.dataset.group ?? "?",
          label: label.slice(0, 60),
          height: Math.round(box.height),
          width: Math.round(box.width),
        });
      }
      return out;
    },
    { min: MIN_TOUCH_HEIGHT, inline: INLINE_LINK },
  );
}

test("touch targets are at least 44px tall", async ({ page }, testInfo) => {
  const small = await findSmallTargets(page);
  const known = knownTapIssues();
  const matched = new Set<KnownIssue>();
  const unexpected = small.filter((item) => {
    const hit = known.find((k) => k.group === item.group && k.label.test(item.label));
    if (hit) matched.add(hit);
    return !hit;
  });
  for (const k of known) {
    testInfo.annotations.push({
      type: matched.has(k) ? "known-issue" : "known-issue-resolved",
      description: `${k.group} ${k.label}: ${k.reason}`,
    });
  }
  expect(
    unexpected,
    unexpected.map((u) => `${u.group}: "${u.label}" is ${u.width}x${u.height}`).join("\n"),
  ).toEqual([]);
});

test("page loads without console errors and screenshots", async ({ page }, testInfo) => {
  const errors = watchConsole(page);
  await page.reload();
  await page.locator("[data-group]").first().waitFor();
  await page.screenshot({ path: `${SHOTS}${viewportName(testInfo)}-page.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("sheets open by pointer without console errors", async ({ page }, testInfo) => {
  const touch = Boolean(testInfo.project.use.hasTouch);
  const errors = watchConsole(page);
  const sheets: { opener: string; name: string }[] = [
    { opener: "Open feedback with NPS", name: "nps" },
    { opener: "Open feedback", name: "feedback" },
    { opener: "Open help", name: "help" },
  ];
  for (const sheet of sheets) {
    await page.getByRole("button", { name: sheet.opener, exact: true }).scrollIntoViewIfNeeded();
    const opener = page.getByRole("button", { name: sheet.opener, exact: true });
    if (touch) await opener.tap();
    else await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    if (sheet.name === "nps") {
      await expect(dialog.getByRole("radio").first()).toBeVisible();
      if (touch) {
        const boxes = await dialog.getByRole("radio").evaluateAll((els) =>
          els.map((el) => Math.round(el.getBoundingClientRect().height)),
        );
        expect(Math.min(...boxes), `NPS score heights: ${boxes.join(",")}`).toBeGreaterThanOrEqual(MIN_TOUCH_HEIGHT);
      }
    }
    await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await page.screenshot({ path: `${SHOTS}${viewportName(testInfo)}-sheet-${sheet.name}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});
