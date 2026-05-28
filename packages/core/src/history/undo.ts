import { readFileSync, renameSync, writeFileSync } from "node:fs";
import type { PatchResult } from "../types.js";
import { resolvePathUnderRoot } from "../paths.js";
import { getLatestEntry } from "./store.js";
import { findByLiteralFallback, findNodeForTarget, parseSource } from "../locate.js";
import * as recast from "recast";

export interface UndoOptions {
  projectRoot: string;
  historyPath: string;
  patchId?: string;
}

export function undoPatch(options: UndoOptions): PatchResult {
  const entry = getLatestEntry(options.historyPath);
  if (!entry) {
    return {
      ok: false,
      code: "TARGET_NOT_FOUND",
      message: "No history to undo",
    };
  }
  if (options.patchId && entry.id !== options.patchId) {
    return {
      ok: false,
      code: "TARGET_NOT_FOUND",
      message: `Patch ${options.patchId} is not the latest entry`,
    };
  }

  const absolutePath = resolvePathUnderRoot(options.projectRoot, entry.filePath);
  if (!absolutePath) {
    return {
      ok: false,
      code: "FILE_BUSY",
      message: "History entry path escapes project root",
    };
  }

  let source: string;
  try {
    source = readFileSync(absolutePath, "utf-8");
  } catch {
    return {
      ok: false,
      code: "FILE_NOT_FOUND",
      message: `File not found: ${entry.filePath}`,
    };
  }
  const ast = parseSource(source);

  const pseudoTarget = {
    id: entry.targetId,
    kind: entry.kind,
    filePath: entry.filePath,
    range: entry.range,
    literal: entry.after,
    literalHash: "",
  };

  let node = findNodeForTarget(ast, pseudoTarget);
  if (!node) {
    node = findByLiteralFallback(ast, { ...pseudoTarget, literal: entry.after });
  }
  if (!node) {
    return {
      ok: false,
      code: "AMBIGUOUS_MATCH",
      message: "Could not locate text for undo",
    };
  }

  if (entry.kind === "jsxText" && node.type === "JSXText") {
    (node as unknown as { value: string }).value = entry.inverse.text;
  } else if (entry.kind === "stringProp" && node.type === "StringLiteral") {
    (node as unknown as { value: string }).value = entry.inverse.text;
  }

  const output = recast.print(ast).code;
  const tmpPath = `${absolutePath}.literature.tmp`;
  writeFileSync(tmpPath, output, "utf-8");
  renameSync(tmpPath, absolutePath);

  return {
    ok: true,
    patchId: entry.id,
    filePath: entry.filePath,
    target: pseudoTarget,
  };
}
