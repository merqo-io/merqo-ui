import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const source = readFileSync(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "./pilot-agreement.md",
  ),
  "utf-8",
);

function section(heading: string): string {
  const start = source.indexOf("## " + heading + "\n");
  expect(start, "Missing section: " + heading).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start);
  const end = rest.indexOf("\n## ", 1);
  return end < 0 ? rest : rest.slice(0, end);
}

const REQUIRED_HEADINGS = [
  "## What this pilot is",
  "## Term and either-party termination",
  "## Service as-is",
  "## Fees",
  "## Feedback",
  "## Confidentiality",
  "## Data during the pilot",
  "## Wind-down",
  "## Converting to the standard terms",
  "## General terms",
];

describe("pilot-agreement.md", () => {
  it.each(REQUIRED_HEADINGS)("contains the %s section", (heading) => {
    expect(source).toContain(heading);
  });

  it("limits the feedback grant to a licence, not an assignment", () => {
    expect(source).toMatch(/licen[cs]e/i);
    expect(source.toLowerCase()).not.toMatch(
      /assigns? all (rights|right,? title)/,
    );
  });

  it("scopes 'as-is' to functionality and availability, not to negligence", () => {
    const disclaimer = section("Service as-is");
    expect(disclaimer).toMatch(/as to functionality\s+and availability only/i);
    expect(disclaimer).toMatch(
      /does not exclude or limit Merqo's liability for its\s+own negligence/i,
    );
    expect(disclaimer).toMatch(
      /not a waiver of\s+Merqo's data protection or confidentiality obligations/i,
    );
  });

  it("includes an explicit wind-down data commitment", () => {
    const windDown = section("Wind-down");
    expect(windDown).toMatch(/full export of its data/i);
    expect(windDown).toMatch(/delete that data within 30 days/i);
    expect(windDown).toMatch(
      /confirm deletion to the Pilot Vendor in writing/i,
    );
  });

  it("states confidentiality is mutual", () => {
    expect(source).toMatch(/mutual/i);
  });

  it("contains no em dash", () => {
    expect(source).not.toMatch(/—/);
  });
});
