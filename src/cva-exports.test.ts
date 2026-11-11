import ts from "typescript";
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.dirname(fileURLToPath(import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [full]
      : [];
  });
}

function isCvaCall(node: ts.Expression | undefined): boolean {
  return (
    !!node &&
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "cva"
  );
}

function collectCvaConsts(
  statement: ts.Statement,
  into: Map<string, boolean>,
): void {
  if (!ts.isVariableStatement(statement)) return;
  const exported = !!statement.modifiers?.some(
    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
  );
  for (const decl of statement.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && isCvaCall(decl.initializer)) {
      into.set(decl.name.text, exported);
    }
  }
}

function collectExportedNames(
  statement: ts.Statement,
  into: Set<string>,
): void {
  if (
    !ts.isExportDeclaration(statement) ||
    statement.moduleSpecifier ||
    !statement.exportClause ||
    !ts.isNamedExports(statement.exportClause)
  ) {
    return;
  }
  for (const el of statement.exportClause.elements) {
    into.add((el.propertyName ?? el.name).text);
  }
}

// An exported value whose type is inferred from cva() makes tsc emit a
// reference into class-variance-authority's internal types path. That fails
// with TS2742 when pnpm builds the package from a git install in its temp
// store, so such values must be wrapped in a function with explicit types.
function exportedCvaValues(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const cvaConsts = new Map<string, boolean>();
  const exportedNames = new Set<string>();
  for (const statement of source.statements) {
    collectCvaConsts(statement, cvaConsts);
    collectExportedNames(statement, exportedNames);
  }
  return [...cvaConsts]
    .filter(([name, exported]) => exported || exportedNames.has(name))
    .map(([name]) => `${path.relative(srcDir, file)}: ${name}`);
}

describe("cva exports", () => {
  it("exports no value whose type is inferred from cva()", () => {
    const offenders = sourceFiles(srcDir).flatMap(exportedCvaValues);
    expect(offenders).toEqual([]);
  });
});
