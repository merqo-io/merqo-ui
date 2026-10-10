import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

// Consumers install this package by git tag, copying the README snippet. A
// release bumps package.json, the README pin and the changelog together, then
// tags v<version>; this fails when one of them is left behind.
describe("release version", () => {
  const { version } = JSON.parse(read("../package.json")) as { version: string };

  it("README install snippet pins the package.json version", () => {
    expect(read("../README.md")).toContain(
      `"@merqo/ui": "github:merqo-io/merqo-ui#v${version}"`,
    );
  });

  it("CHANGELOG has a section for the package.json version", () => {
    expect(read("../CHANGELOG.md")).toContain(`## [${version}]`);
  });
});
