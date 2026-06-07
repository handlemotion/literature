import { realpathSync } from "node:fs";
import path from "node:path";

function resolveRealPath(target: string): string {
  try {
    return realpathSync.native(target);
  } catch {
    const parent = path.dirname(target);
    if (parent === target) return target;
    try {
      const realParent = realpathSync.native(parent);
      return path.join(realParent, path.basename(target));
    } catch {
      return target;
    }
  }
}

/** Resolves a project-relative or absolute path and ensures it stays under projectRoot. */
export function resolvePathUnderRoot(projectRoot: string, filePath: string): string | null {
  const root = resolveRealPath(path.resolve(projectRoot));
  const resolved = resolveRealPath(
    path.resolve(path.isAbsolute(filePath) ? filePath : path.join(root, filePath)),
  );
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}
