import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

function resolveRealPath(target: string): string {
  try {
    return existsSync(target) ? realpathSync.native(target) : target;
  } catch {
    return target;
  }
}

export function resolveWithinRoot(root: string, relativePath: string): string {
  const rootResolved = resolveRealPath(path.resolve(root));
  const target = path.resolve(rootResolved, relativePath);
  const targetResolved = resolveRealPath(target);
  const rel = path.relative(rootResolved, targetResolved);

  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path "${relativePath}" must stay within ${rootResolved}`);
  }

  return target;
}
