import type { Linter, Rule } from "eslint";
import { SHARED_PIECES, type SharedPiece } from "./local-copies";

export type MerqoNoLocalCopiesOptions = {
  /**
   * Pieces a kit keeps on purpose. An entry is a piece id (`"footer"`) or a
   * path suffix without extension (`"components/landing/footer"`); it skips
   * both imports of that path and the file that lives there.
   */
  allow?: string[];
};

const LOCAL_SPECIFIER = /^(?:@\/|~\/|src\/|\.{1,2}(?:\/|$))/;
const EXTENSION = /\.(?:[cm]?[jt]sx?)$/;

const compiled = SHARED_PIECES.map((piece) => ({
  piece,
  regex: new RegExp(`(?:^|/)${piece.pattern}$`),
}));

function stripExtension(path: string): string {
  return path.replace(EXTENSION, "");
}

function normalisePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function findPiece(tail: string): SharedPiece | undefined {
  return compiled.find(({ regex }) => regex.test(tail))?.piece;
}

function isAllowed(piece: SharedPiece, tail: string, allow: string[]): boolean {
  return allow.some((entry) => {
    if (entry === piece.id) return true;
    const suffix = stripExtension(normalisePath(entry));
    return tail === suffix || tail.endsWith(`/${suffix}`);
  });
}

function specifierTail(source: string): string | undefined {
  if (!LOCAL_SPECIFIER.test(source)) return undefined;
  return stripExtension(source.replace(/^(?:@\/|~\/|src\/)/, "").replace(/^(?:\.{1,2}\/)+/, ""));
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
      imported:
        "'{{source}}' is a local copy of a shared piece. Use {{replacement}} and delete the copy.",
      defined:
        "This file is a local copy of a shared piece. Use {{replacement}} and delete the copy.",
    },
  },
  create(context) {
    const allow = (context.options[0] as MerqoNoLocalCopiesOptions | undefined)?.allow ?? [];

    function checkSource(node: Rule.Node, source: unknown) {
      if (typeof source !== "string") return;
      const tail = specifierTail(source);
      if (tail === undefined) return;
      const piece = findPiece(tail);
      if (!piece || isAllowed(piece, tail, allow)) return;
      context.report({
        node,
        messageId: "imported",
        data: { source, replacement: piece.replacement },
      });
    }

    return {
      Program(node) {
        const file = stripExtension(normalisePath(context.filename));
        const piece = findPiece(file);
        if (!piece || isAllowed(piece, file, allow)) return;
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
        if (node.source.type === "Literal") checkSource(node, node.source.value);
      },
    };
  },
};

/**
 * Flags kit code that imports, re-exports or defines a local copy of a piece
 * @merqo/ui now ships, and names the replacement import. Not part of
 * `merqoEslintPreset`: turn it on in the PR that deletes the copies.
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
