import type { Linter, Rule } from "eslint";
import { SHARED_PIECES, type SharedPiece } from "./local-copies";

export type MerqoNoLocalCopiesOptions = {
  /**
   * Pieces a kit keeps on purpose. An entry is a piece id (`"page-header"`)
   * or a path suffix (`"components/landing/page-header"`). Local prefixes
   * (`@/`, `~/`, `src/`, `./`, `../`) and the extension are ignored and the
   * match is case-insensitive. It skips both imports of that path and the
   * file that lives there.
   */
  allow?: string[];
};

const LOCAL_SPECIFIER = /^(?:@\/|~\/|src\/|\.{1,2}(?:\/|$))/;
const LOCAL_PREFIX = /^(?:(?:@\/|~\/|src\/|\.{1,2}\/)+)/;
const EXTENSION = /\.(?:[cm]?[jt]sx?)$/;
const COMPONENT_FILE = /\.[jt]sx$/;
const SHARED_SOURCE = /^@merqo\/ui(?:\/|$)/;
const ALLOW_HINT = "or add it to `allow` if it wraps the shared piece";

const compiled = SHARED_PIECES.map((piece) => ({
  piece,
  regex: new RegExp(`(?:^|/)${piece.pattern}$`),
}));

function normalisePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(EXTENSION, "")
    .replace(/\/index$/, "");
}

function findPieces(tail: string): SharedPiece[] {
  return compiled.filter(({ regex }) => regex.test(tail)).map(({ piece }) => piece);
}

function isAllowed(piece: SharedPiece, tail: string, allow: string[]): boolean {
  const lowerTail = tail.toLowerCase();
  return allow.some((entry) => {
    const lowerEntry = entry.toLowerCase();
    if (lowerEntry === piece.id) return true;
    const suffix = normalisePath(lowerEntry.replace(LOCAL_PREFIX, ""));
    return lowerTail === suffix || lowerTail.endsWith(`/${suffix}`);
  });
}

function specifierTail(source: string): string | undefined {
  if (!LOCAL_SPECIFIER.test(source)) return undefined;
  return normalisePath(source.replace(LOCAL_PREFIX, ""));
}

function importsSharedPackage(body: readonly { type: string; source?: unknown }[]): boolean {
  return body.some((statement) => {
    const source = statement.source as { value?: unknown } | null | undefined;
    return typeof source?.value === "string" && SHARED_SOURCE.test(source.value);
  });
}

type RequiredSpecifier = {
  type: string;
  importKind?: string;
  exportKind?: string;
  imported?: SpecifierName;
  local?: SpecifierName;
};
type RequiredStatement = {
  type: string;
  source?: { value?: unknown } | null;
  importKind?: string;
  exportKind?: string;
  specifiers?: RequiredSpecifier[];
};

// Only the package root counts: a subpath or a type-only import does not
// render the shared page, and a re-export of the name does.
function importsRequired(body: readonly RequiredStatement[], names: readonly string[]): boolean {
  return body.some((statement) => {
    const isImport = statement.type === "ImportDeclaration";
    const isExport = statement.type === "ExportNamedDeclaration";
    if (!isImport && !isExport) return false;
    if (statement.source?.value !== "@merqo/ui") return false;
    if ((isImport ? statement.importKind : statement.exportKind) === "type") return false;
    return (statement.specifiers ?? []).some((specifier) => {
      if ((isImport ? specifier.importKind : specifier.exportKind) === "type") return false;
      const id = isImport ? specifier.imported : specifier.local;
      const name = id?.name ?? id?.value;
      return name !== undefined && names.includes(name);
    });
  });
}

type SpecifierName = { name?: string; value?: string };

function importedNames(node: Rule.Node): string[] {
  const specifiers =
    (node as unknown as { specifiers?: { imported?: SpecifierName; local?: SpecifierName }[] })
      .specifiers ?? [];
  return specifiers.flatMap((specifier) => {
    const id = specifier.imported ?? specifier.local;
    const name = id?.name ?? id?.value;
    return name ? [name] : [];
  });
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: { allow: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: {
      imported: `'{{source}}' is a local copy of a shared piece. Use {{replacement}} and delete the copy, ${ALLOW_HINT}.`,
      defined: `This file is a local copy of a shared piece. Use {{replacement}} and delete the copy, ${ALLOW_HINT}.`,
      custom: "{{message}}",
    },
  },
  create(context) {
    const allow = (context.options[0] as MerqoNoLocalCopiesOptions | undefined)?.allow ?? [];

    function checkSource(node: Rule.Node, source: unknown, dynamic = false) {
      if (typeof source !== "string") return;
      const tail = specifierTail(source);
      if (tail === undefined) return;
      const piece = findPieces(tail).find((candidate) => {
        if (candidate.requiredImport || isAllowed(candidate, tail, allow)) return false;
        if (!candidate.importNames) return true;
        return (
          !dynamic && importedNames(node).some((name) => candidate.importNames?.includes(name))
        );
      });
      if (!piece) return;
      if (piece.message) {
        context.report({ node, messageId: "custom", data: { message: piece.message } });
        return;
      }
      context.report({
        node,
        messageId: "imported",
        data: { source, replacement: piece.replacement },
      });
    }

    return {
      Program(node) {
        const file = normalisePath(context.filename);
        const body = node.body as { type: string; source?: unknown }[];
        for (const piece of findPieces(file)) {
          if (piece.importNames || isAllowed(piece, file, allow)) continue;
          if (piece.requiredImport) {
            if (!COMPONENT_FILE.test(context.filename)) continue;
            if (importsRequired(body as RequiredStatement[], piece.requiredImport)) continue;
          } else if (importsSharedPackage(body)) {
            continue;
          }
          context.report({
            node,
            messageId: piece.message ? "custom" : "defined",
            data: { message: piece.message, replacement: piece.replacement },
          });
          return;
        }
      },
      ImportDeclaration(node) {
        checkSource(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        checkSource(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) checkSource(node, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === "Literal") checkSource(node, node.source.value, true);
      },
    };
  },
};

/**
 * Flags kit code that imports, re-exports or defines a local copy of a piece
 * @merqo/ui now ships, and names the replacement import. A file that itself
 * imports from @merqo/ui is a wrapper, so it is not reported as a copy. Not
 * part of `merqoEslintPreset`: turn it on in the PR that deletes the copies.
 */
export function merqoNoLocalCopies(options: MerqoNoLocalCopiesOptions = {}): Linter.Config[] {
  return [
    {
      name: "merqo/no-local-copies",
      files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
      plugins: { merqo: { rules: { "no-local-copy": rule } } },
      rules: { "merqo/no-local-copy": ["error", { allow: options.allow ?? [] }] },
    },
  ];
}
