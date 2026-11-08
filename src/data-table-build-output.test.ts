import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const built = existsSync(path.join(dist, "data-table.js"));

// A paginated table mounts a client pager; the table itself must stay free of
// a directive and must import the pager rather than inline it, or a Server
// Component using DataTable would be turned into a client reference.
describe.skipIf(!built)("DataTable build output", () => {
  const table = built ? readFileSync(path.join(dist, "data-table.js"), "utf-8") : "";
  const pager = built ? readFileSync(path.join(dist, "data-table-pager.js"), "utf-8") : "";

  it("keeps the directive on the pager and off the table", () => {
    expect(pager.startsWith('"use client";')).toBe(true);
    expect(table).not.toMatch(/["']use client["']/);
  });

  it("imports the pager instead of inlining it", () => {
    expect(table).toMatch(/import\s*\{\s*DataTablePager\s*\}\s*from\s*"\.\/chunk-/);
    expect(table).not.toContain("function DataTablePager");
  });
});
