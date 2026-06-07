import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveWithinRoot } from "../utils/paths.js";
import type { PatchOptions } from "./types.js";

function resolveWritePath(filePath: string, options: PatchOptions): string {
  if (!options.root) return filePath;
  const relative = path.relative(path.resolve(options.root), path.resolve(filePath));
  return resolveWithinRoot(options.root, relative);
}

export function writeTextFile(filePath: string, content: string, options: PatchOptions): boolean {
  if (options.dryRun) return true;
  writeFileSync(resolveWritePath(filePath, options), content, "utf-8");
  return true;
}

export function writeTextFileIfMissing(
  filePath: string,
  content: string,
  options: PatchOptions,
): boolean {
  if (existsSync(filePath) && !options.force) return false;
  if (options.dryRun) return true;
  const target = resolveWritePath(filePath, options);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content, "utf-8");
  return true;
}

export function ensureEmptyFile(filePath: string, options: PatchOptions): void {
  if (options.dryRun) return;
  writeFileSync(resolveWritePath(filePath, options), "", "utf-8");
}
