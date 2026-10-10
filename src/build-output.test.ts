import ts from "typescript";
import { beforeAll, describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// Build before running this suite; missing artifacts are a validation failure.
const distIndexPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist/index.js",
);
const distExists = existsSync(distIndexPath);

const distDtsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist/index.d.ts",
);
const distDtsExists = existsSync(distDtsPath);

function parseBuildEntries(config: string) {
  const source = ts.createSourceFile(
    "tsup.config.ts",
    config,
    ts.ScriptTarget.Latest,
    true,
  );
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => ts.isIdentifier(item.name) && item.name.text === "ENTRIES");
  const initializer = declaration?.initializer;
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) return [];
  return initializer.properties.flatMap((property) => {
    if (
      !ts.isPropertyAssignment(property) ||
      !ts.isStringLiteral(property.initializer)
    )
      return [];
    if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
      return [{ name: property.name.text, source: property.initializer.text }];
    return [];
  });
}

describe("build output", () => {
  beforeAll(() => {
    expect(
      distExists,
      "Run pnpm build before these tests: dist/index.js is missing",
    ).toBe(true);
    expect(
      distDtsExists,
      "Run pnpm build before these tests: dist/index.d.ts is missing",
    ).toBe(true);
  });
  // A cold import of the whole barrel can take 15 to 22 s on a Windows
  // checkout, and longer while the rest of the suite runs beside it, so both
  // limits sit far above the 30 s default in vitest.config.ts.
  it("loads actual built exports in a fresh Node process", { timeout: 150_000 }, () => {
    const script = `const built = await import(process.argv[1]);
      console.log(JSON.stringify({ google: typeof built.GoogleMark,
        socialFields: Array.isArray(built.SOCIAL_LINK_FIELDS),
        legalVersion: typeof built.LEGAL_VERSIONS.terms,
        qr: typeof built.qrSvg }));`;
    const stdout = execFileSync(
      process.execPath,
      ["--input-type=module", "-e", script, pathToFileURL(distIndexPath).href],
      {
        encoding: "utf8",
        env: {
          NODE_ENV: "test",
          ...(process.env.SystemRoot
            ? { SystemRoot: process.env.SystemRoot }
            : {}),
        },
        timeout: 120_000,
      },
    );
    expect(JSON.parse(stdout)).toEqual({
      google: "function",
      socialFields: true,
      legalVersion: "string",
      qr: "function",
    });
  });
  it('dist/index.js carries no "use client" directive (regression guard: a package-wide directive turns every plain-data export into a client reference, so a Server Component reading e.g. SOCIAL_LINK_FIELDS gets an opaque stub instead of the array - see qkit docs/meta/2026-09-18 AAR)', () => {
    const contents = readFileSync(distIndexPath, "utf-8");
    expect(contents.startsWith('"use client";')).toBe(false);
    expect(contents).not.toMatch(/["']use client["']/);
  });

  it('every entry whose source declares "use client" keeps that directive in its own dist file (regression guard: esbuild strips bare directives when it bundles several modules into one output, which is why index re-exports instead of bundling - see scripts/build-index.mjs)', () => {
    const distDir = path.dirname(distIndexPath);
    const packageRoot = path.resolve(distDir, "..");
    // Read tsup.config.ts as text rather than importing it: importing pulls
    // in tsup -> esbuild, which refuses to load under vitest's jsdom
    // environment ("new TextEncoder().encode('') instanceof Uint8Array").
    const config = readFileSync(
      path.resolve(packageRoot, "tsup.config.ts"),
      "utf-8",
    );
    const entries = parseBuildEntries(config);
    expect(entries.length).toBeGreaterThan(0);
    const clientEntries = entries.filter(({ source }) =>
      readFileSync(path.resolve(packageRoot, source), "utf-8").startsWith(
        '"use client"',
      ),
    );
    expect(clientEntries.length).toBeGreaterThan(0);
    for (const { name } of clientEntries) {
      const built = path.resolve(distDir, `${name}.js`);
      expect(existsSync(built), `dist/${name}.js is missing`).toBe(true);
      expect(
        readFileSync(built, "utf-8").startsWith('"use client";'),
        `dist/${name}.js lost its "use client" directive`,
      ).toBe(true);
    }
  });

  it("every sibling module dist/index.d.ts re-exports from actually exists (regression guard: a Linux-only rollup-plugin-dts failure once left dist/index.d.ts pointing at sibling .d.ts files that were never emitted, silently degrading every @merqo/ui import to `any` in consumers - see tsup.config.ts's dts:false comment)", () => {
    const contents = readFileSync(distDtsPath, "utf-8");
    const distDir = path.dirname(distDtsPath);
    const specifiers = [...contents.matchAll(/from ["'](\.[^"']+)["']/g)].map(
      (m) => m[1],
    );
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      const resolved = path.resolve(distDir, `${specifier}.d.ts`);
      expect(
        existsSync(resolved),
        `${specifier}.d.ts (from index.d.ts) is missing`,
      ).toBe(true);
    }
  });
});
