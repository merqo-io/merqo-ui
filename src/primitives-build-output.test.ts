import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const built = existsSync(path.join(dist, "primitives.js"));

const CLIENT = [
  "alert-dialog",
  "checkbox",
  "dialog",
  "dropdown-menu",
  "label",
  "popover",
  "select",
  "sheet",
  "switch",
  "tabs",
  "toggle",
  "toggle-group",
  "tooltip",
];
const PLAIN = ["badge", "button", "card", "input", "skeleton", "textarea"];

// A Server Component imports `cn` or Button from the subpath: the shim must
// carry no directive and point at per-module files, so only the client
// primitives become client references.
describe.skipIf(!built)("@merqo/ui/primitives build output", () => {
  const read = (file: string) => readFileSync(path.join(dist, file), "utf-8");

  it("is a directive-free re-export shim", () => {
    const shim = read("primitives.js");
    expect(shim).not.toMatch(/["']use client["']/);
    expect(shim).not.toContain("function ");
    expect(shim).toMatch(/export\s*\{\s*cn\s*\}\s*from\s*"\.\/lib\/utils\.js"/);
    for (const name of [...CLIENT, ...PLAIN]) {
      expect(shim).toContain(`from "./ui/${name}.js"`);
    }
  });

  it.each(CLIENT)("keeps the directive on ui/%s", (name) => {
    expect(read(`ui/${name}.js`).startsWith('"use client";')).toBe(true);
  });

  it.each(PLAIN)("keeps ui/%s server-safe", (name) => {
    expect(read(`ui/${name}.js`)).not.toMatch(/["']use client["']/);
  });

  it("keeps cn free of a directive", () => {
    expect(read("lib/utils.js")).not.toMatch(/["']use client["']/);
  });
});
