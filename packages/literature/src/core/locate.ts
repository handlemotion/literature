import * as recast from "recast";

type AstNode = recast.types.namedTypes.Node;
import tsParser from "recast/parsers/typescript.js";
import type { SourceRange, TextTarget, TextTargetKind } from "./types.js";
import { literalHash, normalizeLiteral } from "./hash.js";

function rangeFromLoc(
  loc:
    | { start: { line: number; column: number }; end: { line: number; column: number } }
    | null
    | undefined,
): SourceRange | null {
  if (!loc?.start || !loc?.end) return null;
  return {
    start: { line: loc.start.line, column: loc.start.column },
    end: { line: loc.end.line, column: loc.end.column },
  };
}

function rangesEqual(a: SourceRange, b: SourceRange): boolean {
  return (
    a.start.line === b.start.line &&
    a.start.column === b.start.column &&
    a.end.line === b.end.line &&
    a.end.column === b.end.column
  );
}

function nodeMatchesTarget(node: AstNode, target: TextTarget): boolean {
  const range = rangeFromLoc(node.loc);
  if (!range) return false;
  if (rangesEqual(range, target.range)) return true;
  const value = getNodeLiteral(node, target.kind);
  if (value === null) return false;
  return literalHash(value) === target.literalHash;
}

function getNodeLiteral(node: AstNode, kind: TextTargetKind): string | null {
  if (kind === "jsxText" && node.type === "JSXText") {
    const n = node as unknown as { value: string };
    return normalizeLiteral(n.value);
  }
  if (kind === "stringProp" && node.type === "StringLiteral") {
    const n = node as unknown as { value: string };
    return n.value;
  }
  return null;
}

export function findNodeForTarget(
  ast: recast.types.namedTypes.File,
  target: TextTarget,
): AstNode | null {
  let found: AstNode | null = null;
  let ambiguous = false;

  recast.types.visit(ast, {
    visitJSXText(path) {
      if (target.kind !== "jsxText") return false;
      if (nodeMatchesTarget(path.node, target)) {
        if (found) ambiguous = true;
        found = path.node;
      }
      return false;
    },
    visitStringLiteral(path) {
      if (target.kind !== "stringProp") return false;
      if (nodeMatchesTarget(path.node, target)) {
        if (found) ambiguous = true;
        found = path.node;
      }
      return false;
    },
  });

  if (ambiguous) return null;
  return found;
}

export function findByLiteralFallback(
  ast: recast.types.namedTypes.File,
  target: TextTarget,
): AstNode | null {
  const matches: AstNode[] = [];
  recast.types.visit(ast, {
    visitJSXText(path) {
      if (target.kind !== "jsxText") return false;
      const value = normalizeLiteral((path.node as { value: string }).value);
      if (value === target.literal && literalHash(value) === target.literalHash) {
        matches.push(path.node);
      }
      return false;
    },
    visitStringLiteral(path) {
      if (target.kind !== "stringProp") return false;
      const value = (path.node as { value: string }).value;
      if (value === target.literal && literalHash(value) === target.literalHash) {
        matches.push(path.node);
      }
      return false;
    },
  });
  if (matches.length === 1) return matches[0] ?? null;
  return null;
}

export function parseSource(source: string): recast.types.namedTypes.File {
  return recast.parse(source, { parser: tsParser }) as recast.types.namedTypes.File;
}
