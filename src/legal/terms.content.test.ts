import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const source = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./terms.md"),
  "utf-8",
);

const REQUIRED_HEADINGS = [
  "## Who we are",
  "## Acceptable use",
  "## Your account",
  "## Fees and billing",
  "## Refunds and cancellation",
  "## Our intellectual property",
  "## Your content and intellectual property",
  "## Data protection",
  "## Security incident notification",
  "## Vendor indemnity",
  "## Service availability",
  "## Our liability to you",
  "## Confidentiality",
  "## Force majeure",
  "## Changes to these terms",
  "## Term and termination",
  "## Governing law and disputes",
  "## General terms",
];

describe("terms.md", () => {
  it.each(REQUIRED_HEADINGS)("contains the %s section", (heading) => {
    expect(source).toContain(heading);
  });

  it("names Merqo's contracting party, pre-ACRA", () => {
    expect(source).toContain("Clarence Lee, trading as Merqo");
    expect(source).toContain("not yet registered with");
    expect(source).not.toMatch(/registration pending|intend to apply/);
  });

  it("states the founding merchant price lock", () => {
    expect(source).toContain("founding merchant offer");
    expect(source).toContain("12 months from your first paid billing cycle");
  });

  it("contains no em dash", () => {
    expect(source).not.toMatch(/—/);
  });

  it("does not contain a blanket liability exclusion", () => {
    expect(source.toLowerCase()).not.toMatch(/no liability whatsoever/);
  });

  it("does not name an arbitration body", () => {
    expect(source).not.toMatch(/SIAC|arbitration/i);
  });

  it("preserves Small Claims Tribunal access", () => {
    expect(source).toMatch(/Small Claims Tribunal/i);
  });
});
