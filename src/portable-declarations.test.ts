import ts from "typescript";
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Kits install this package from a git tarball, so `prepare` runs the
// declaration build inside pnpm's temporary store directory. There an
// inferred `React.JSX.Element` cannot be named portably (TS2742), but a type
// imported from "react" can. A .tsx module with no import from "react" must
// therefore annotate the return type of every exported function.
const srcDir = path.dirname(fileURLToPath(import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".tsx") && !entry.name.includes(".test.")
      ? [full]
      : [];
  });
}

function unportableExports(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const importsReact = source.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "react",
  );
  if (importsReact) return [];
  return source.statements.flatMap((statement) => {
    const exported = ts
      .getModifiers(statement as ts.HasModifiers)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported || !ts.isFunctionDeclaration(statement)) return [];
    return statement.type ? [] : [statement.name?.text ?? "default"];
  });
}

describe("portable declarations", () => {
  it("annotates exported functions in .tsx modules that do not import from react", () => {
    const offenders = sourceFiles(srcDir).flatMap((file) =>
      unportableExports(file).map(
        (name) => `${path.relative(srcDir, file)}: ${name}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
