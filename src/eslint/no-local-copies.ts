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

function findPiece(tail: string): SharedPiece | undefined {
  return compiled.find(({ regex }) => regex.test(tail))?.piece;
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
      const piece = findPiece(tail);
      if (!piece || isAllowed(piece, tail, allow)) return;
      if (piece.importNames) {
        if (dynamic || !importedNames(node).some((name) => piece.importNames?.includes(name))) {
          return;
        }
      }
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
        const piece = findPiece(file);
        if (!piece || piece.importNames || isAllowed(piece, file, allow)) return;
        if (importsSharedPackage(node.body as { type: string; source?: unknown }[])) return;
        context.report({ node, messageId: "defined", data: { replacement: piece.replacement } });
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
