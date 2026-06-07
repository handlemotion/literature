import * as recast from "recast";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { LiteratureManifest, PatchResult, TextTarget } from "./types.js";
import { resolvePathUnderRoot } from "./paths.js";
import { findByLiteralFallback, findNodeForTarget, parseSource } from "./locate.js";
import { literalHash, normalizeLiteral } from "./hash.js";
import { appendHistory } from "./history/store.js";
import type { HistoryEntry } from "./types.js";

export interface ApplyPatchOptions {
  projectRoot: string;
  manifest: LiteratureManifest;
  targetId: string;
  nextText: string;
  historyPath: string;
}

export function applyPatch(options: ApplyPatchOptions): PatchResult {
  const target = options.manifest.targets[options.targetId];
  if (!target) {
    return {
      ok: false,
      code: "TARGET_NOT_FOUND",
      message: `Unknown target: ${options.targetId}`,
    };
  }

  const absolutePath = resolvePathUnderRoot(options.projectRoot, target.filePath);
  if (!absolutePath) {
    return {
      ok: false,
      code: "FILE_BUSY",
      message: "Path escapes project root",
    };
  }

  let source: string;
  try {
    source = readFileSync(absolutePath, "utf-8");
  } catch {
    return {
      ok: false,
      code: "FILE_NOT_FOUND",
      message: `File not found: ${target.filePath}`,
    };
  }

  const ast = parseSource(source, target.filePath);
  let node = findNodeForTarget(ast, target);
  if (!node) {
    node = findByLiteralFallback(ast, target);
  }
  if (!node) {
    return {
      ok: false,
      code: "AMBIGUOUS_MATCH",
      message: "Could not locate text node in source (file may have changed)",
    };
  }

  const before = getNodeText(node, target);
  if (before === null) {
    return {
      ok: false,
      code: "UNSUPPORTED_NODE",
      message: "Matched node is not editable text",
    };
  }

  if (normalizeLiteral(before) !== target.literal && target.literalHash) {
    return {
      ok: false,
      code: "LITERAL_MISMATCH",
      message: "Source text no longer matches compile-time snapshot",
      details: { expected: target.literal, found: before },
    };
  }

  setNodeText(node, target, options.nextText);
  const output = recast.print(ast).code;
  const tmpPath = `${absolutePath}.literature.tmp`;
  writeFileSync(tmpPath, output, "utf-8");
  renameSync(tmpPath, absolutePath);

  const patchId = randomUUID();
  const entry: HistoryEntry = {
    id: patchId,
    ts: new Date().toISOString(),
    targetId: target.id,
    filePath: target.filePath,
    kind: target.kind,
    range: target.range,
    before,
    after: options.nextText,
    inverse: { range: target.range, text: before },
  };
  appendHistory(options.historyPath, entry);

  const nextLiteral = normalizeLiteral(options.nextText);
  const updatedTarget: TextTarget = {
    ...target,
    literal: nextLiteral,
    literalHash: literalHash(nextLiteral),
  };

  return {
    ok: true,
    patchId,
    filePath: target.filePath,
    target: updatedTarget,
  };
}

function getNodeText(node: recast.types.namedTypes.Node, target: TextTarget): string | null {
  if (target.kind === "jsxText" && node.type === "JSXText") {
    return normalizeLiteral((node as unknown as { value: string }).value);
  }
  if (target.kind === "stringProp" && node.type === "StringLiteral") {
    return (node as unknown as { value: string }).value;
  }
  return null;
}

function setNodeText(
  node: recast.types.namedTypes.Node,
  target: TextTarget,
  nextText: string,
): void {
  if (target.kind === "jsxText" && node.type === "JSXText") {
    (node as unknown as { value: string }).value = nextText;
    return;
  }
  if (target.kind === "stringProp" && node.type === "StringLiteral") {
    (node as unknown as { value: string }).value = nextText;
  }
}
