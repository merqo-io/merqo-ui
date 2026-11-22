import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raw = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./terms.md"),
  "utf-8",
);
const source = raw.replace(/\s+/g, " ");

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
    expect(source).toContain("a personal software project built and run by Clarence Lee");
    expect(source).toContain("not registered with ACRA");
    expect(source).not.toContain("trading as");
    expect(source).not.toContain("once one is incorporated");
    expect(source).not.toMatch(/registration pending|intend to apply/);
  });

  it("states Merqo is free during the pilot", () => {
    expect(source).toContain("Merqo is free during the pilot and no fees are charged.");
  });

  it("bills by plan, not per Kit", () => {
    expect(source).toContain("billed by plan, not per Kit");
    expect(source).not.toMatch(/per Kit,|rate per Kit/);
  });

  it("holds the price while subscribed and drops the 12-month launch price", () => {
    expect(source).toContain("holds for as long as you stay subscribed");
    expect(source).not.toContain("12 months from your first");
    expect(source).not.toContain("launch price");
  });

  it("absorbs GST for existing subscribers", () => {
    expect(source).toContain("Merqo absorbs the GST");
    expect(source).not.toContain("GST will be added");
  });

  it("keeps founding merchant terms conditional and novation-safe", () => {
    expect(source).toContain("founding merchant offer");
    expect(source).toContain("assigned or novated");
  });

  it("states no prices", () => {
    expect(source).not.toContain("S$");
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
