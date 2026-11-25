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
    if (Math.max(doc.scrollWidth, document.body.scrollWidth) > doc.clientWidth) {
      for (const group of document.querySelectorAll<HTMLElement>("[data-group]")) {
        if (group.scrollWidth > group.clientWidth) offenders.push(group.dataset.group ?? "?");
      }
      if (offenders.length === 0) offenders.push("(page chrome)");
    }
    const scrollWidth = Math.max(doc.scrollWidth, document.body.scrollWidth);
    return { scrollWidth, clientWidth: doc.clientWidth, offenders };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow in: ${overflow.offenders.join(", ")}`,
  ).toBeLessThanOrEqual(overflow.clientWidth);
});

const DATA_GROUPS = ["StatTile", "PricingLadder", "AuditLogTable", "DataTable and DataTablePager", "Skeletons"];

// Clipped content leaves no page-level scroll, so the page check alone cannot
// see it. Any element inside these groups whose content is wider than its box
// is hiding data (a truncated value or a scrolling table).
test("data components show every value without clipping or inner scroll", async ({ page }) => {
  const clipped = await page.evaluate((names) => {
    const out: string[] = [];
    for (const group of document.querySelectorAll<HTMLElement>("[data-group]")) {
      if (!names.includes(group.dataset.group ?? "")) continue;
      for (const el of group.querySelectorAll<HTMLElement>("*")) {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !(el instanceof SVGElement) && !el.matches(".sr-only")) {
          out.push(`${group.dataset.group}: <${el.tagName.toLowerCase()}> ${(el.textContent ?? "").slice(0, 40)}`);
        }
      }
    }
    return out;
  }, DATA_GROUPS);
  expect(clipped).toEqual([]);
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
      // A pseudo-element hit area (the tooltip trigger's after:size-11) makes a
      // control tappable beyond its painted box, but only when it sits over
      // the control and is at least `min` in both dimensions.
      const effectiveHeight = (el: HTMLElement, box: DOMRect, min: number) => {
        const after = getComputedStyle(el, "::after");
        if (after.position !== "absolute" || after.display === "none") return box.height;
        const style = getComputedStyle(el);
        const width = Number.parseFloat(after.width);
        const height = Number.parseFloat(after.height);
        const top = Number.parseFloat(after.top);
        const left = Number.parseFloat(after.left);
        if ([width, height, top, left].some(Number.isNaN)) return box.height;
        const [tx = "0px", ty = tx] = after.translate === "none" ? [] : after.translate.split(" ");
        const shift = (token: string, size: number) =>
          token.endsWith("%") ? (Number.parseFloat(token) / 100) * size : Number.parseFloat(token);
        const originX = box.left + Number.parseFloat(style.borderLeftWidth);
        const originY = box.top + Number.parseFloat(style.borderTopWidth);
        const x = originX + left + shift(tx, width);
        const y = originY + top + shift(ty, height);
        const covers =
          x <= box.left && y <= box.top && x + width >= box.right && y + height >= box.bottom;
        return covers && width >= min && height >= min ? height : box.height;
      };
      for (const el of document.querySelectorAll<HTMLElement>(`#preview-root ${selector}`)) {
        if (el.matches(inline)) continue;
        if (!isVisible(el)) continue;
        const box = el.getBoundingClientRect();
        if (effectiveHeight(el, box, min) >= min) continue;
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

const MIN_TAP_WIDTH = 32;

type Dialog = ReturnType<Page["getByRole"]>;

async function openSheet(page: Page, opener: string, touch: boolean) {
  const button = page.getByRole("button", { name: opener, exact: true });
  await button.scrollIntoViewIfNeeded();
  if (touch) await button.tap();
  else await button.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  return dialog;
}

async function press(target: Dialog, touch: boolean) {
  if (touch) await target.tap();
  else await target.click();
}

async function expectSheetFits(dialog: Dialog, state: string) {
  const result = await dialog.evaluate((el) => {
    const bounds = el.getBoundingClientRect();
    const clipped: string[] = [];
    for (const child of el.querySelectorAll<HTMLElement>("*")) {
      const box = child.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (box.right > bounds.right + 0.5 || box.left < bounds.left - 0.5) {
        clipped.push(`${child.tagName.toLowerCase()}:${(child.textContent ?? "").trim().slice(0, 20)}`);
      }
    }
    return { scroll: el.scrollWidth, client: el.clientWidth, clipped };
  });
  expect(result.scroll, `${state}: sheet scrolls horizontally`).toBeLessThanOrEqual(result.client);
  expect(result.clipped, `${state}: elements outside the sheet`).toEqual([]);
}

// Sizes are enforced on the touch project only: the 44px rule is a coarse-pointer
// class (pointer-coarse:min-h-11), so the desktop run has nothing to assert.
async function expectTapTargets(dialog: Dialog, state: string, touch: boolean) {
  const small = await dialog.evaluate(
    (el, { minH, minW }) => {
      const out: string[] = [];
      for (const node of el.querySelectorAll<HTMLElement>("button, input, textarea, [role=radio]")) {
        const box = node.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        if (node.textContent?.trim() === "Close") continue;
        if (box.height < minH || box.width < minW) {
          const name = node.getAttribute("aria-label") ?? (node.textContent?.trim() || node.tagName);
          out.push(`${name} ${Math.round(box.width)}x${Math.round(box.height)}`);
        }
      }
      return out;
    },
    { minH: touch ? MIN_TOUCH_HEIGHT : 0, minW: touch ? MIN_TAP_WIDTH : 0 },
  );
  expect(small, `${state}: small tap targets`).toEqual([]);
}

async function shoot(page: Page, testInfo: { project: { name: string } }, name: string) {
  await page.screenshot({ path: `${SHOTS}${viewportName(testInfo)}-sheet-${name}.png` });
}

async function finishSend(
  page: Page,
  dialog: Dialog,
  testInfo: { project: { name: string } },
  expected: { touch: boolean; heading: string; shot: string },
) {
  const { touch, heading, shot } = expected;
  await expect(dialog.getByText(heading)).toBeVisible();
  const done = dialog.getByRole("button", { name: "Done", exact: true });
  await expect(done).toBeInViewport();
  await expectSheetFits(dialog, `${shot} sent`);
  await expectTapTargets(dialog, `${shot} sent`, touch);
  await shoot(page, testInfo, `${shot}-sent`);
  await press(done, touch);
  await expect(dialog).toBeHidden();
}

test("hand-rolled controls show a focus ring when tabbed to", async ({ page }) => {
  const group = page.locator('[data-group="Touch and focus controls"]');
  await group.scrollIntoViewIfNeeded();
  const burger = group.getByRole("button", { name: "Mobile navigation menu" });
  const navEntry = (await burger.isVisible()) ? burger : group.getByRole("link", { name: "Orders" });
  const targets = [
    navEntry,
    group.getByRole("checkbox"),
    group.getByRole("button", { name: "Save changes" }),
  ];
  for (const target of targets) {
    await target.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
    const ring = await target.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(ring, "focus-visible ring").not.toBe("none");
  }
});

test("feedback sheet with NPS: fit, targets, validation and sent states", async ({ page }, testInfo) => {
  const touch = Boolean(testInfo.project.use.hasTouch);
  const errors = watchConsole(page);
  const dialog = await openSheet(page, "Open feedback with NPS", touch);

  await expect(dialog.getByText("How likely are you to recommend us?").first()).toBeVisible();
  await expect(dialog.getByRole("radio")).toHaveCount(11);
  await expectSheetFits(dialog, "nps open");
  await expectTapTargets(dialog, "nps open", touch);
  await shoot(page, testInfo, "nps-open");

  const send = dialog.getByRole("button", { name: "Send", exact: true });
  await press(send, touch);
  await expect(dialog.getByText("Pick a score first")).toBeVisible();
  await expectSheetFits(dialog, "nps score error");
  await shoot(page, testInfo, "nps-score-error");

  const pill = dialog.getByRole("radio", { name: "9", exact: true });
  await press(pill, touch);
  await expect(pill).toBeChecked();
  await press(send, touch);
  await finishSend(page, dialog, testInfo, { touch, heading: "Feedback sent", shot: "nps" });
  expect(errors).toEqual([]);
});

test("feedback sheet: empty submit error and sent state", async ({ page }, testInfo) => {
  const touch = Boolean(testInfo.project.use.hasTouch);
  const errors = watchConsole(page);
  const dialog = await openSheet(page, "Open feedback", touch);
  await expectSheetFits(dialog, "feedback open");
  await expectTapTargets(dialog, "feedback open", touch);

  const send = dialog.getByRole("button", { name: "Send", exact: true });
  await press(send, touch);
  await expect(dialog.getByText("Write a message first")).toBeVisible();
  await expectSheetFits(dialog, "feedback error");
  await shoot(page, testInfo, "feedback-error");

  await dialog.getByRole("textbox").fill("Looks good on a phone");
  await press(send, touch);
  await finishSend(page, dialog, testInfo, { touch, heading: "Feedback sent", shot: "feedback" });
  expect(errors).toEqual([]);
});

test("help sheet: fit, empty submit error and sent state", async ({ page }, testInfo) => {
  const touch = Boolean(testInfo.project.use.hasTouch);
  const errors = watchConsole(page);
  const dialog = await openSheet(page, "Open help", touch);
  await expectSheetFits(dialog, "help open");
  await expectTapTargets(dialog, "help open", touch);
  await shoot(page, testInfo, "help-open");

  const send = dialog.getByRole("button", { name: "Send", exact: true });
  await press(send, touch);
  await expect(dialog.getByText("Write a message first")).toBeVisible();
  await expectSheetFits(dialog, "help error");
  await shoot(page, testInfo, "help-error");

  await dialog.getByRole("textbox").fill("I need a hand with billing");
  await press(send, touch);
  await finishSend(page, dialog, testInfo, { touch, heading: "Message sent", shot: "help" });
  expect(errors).toEqual([]);
});

// The title box includes its end padding, so overlap is judged against the
// rendered text lines, which is what a vendor would see run under the mark.
test("signature slot stays clear of the title text and inside the card", async ({ page }) => {
  const group = page.locator('[data-group="Signature slot"]');
  await group.scrollIntoViewIfNeeded();
  const result = await group.evaluate((root) => {
    const rects = (r: DOMRect) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    return Array.from(root.querySelectorAll<HTMLElement>("main > div > div")).map((card) => {
      const mark = card.querySelector<HTMLElement>('[aria-hidden="true"]')!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(card.querySelector("h1")!);
      const lines = Array.from(range.getClientRects()).map(rects);
      const box = card.getBoundingClientRect();
      const hit = lines.some(
        (l) => l.left < mark.right && mark.left < l.right && l.top < mark.bottom && mark.top < l.bottom,
      );
      return { hit, lines: lines.length, inside: mark.right <= box.right && mark.left >= box.left };
    });
  });
  expect(result).toHaveLength(2);
  for (const card of result) {
    expect(card.lines).toBeGreaterThan(0);
    expect(card.hit).toBe(false);
    expect(card.inside).toBe(true);
  }
});
