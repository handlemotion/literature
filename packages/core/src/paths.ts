import path from "node:path";

/** Resolves a project-relative or absolute path and ensures it stays under projectRoot. */
export function resolvePathUnderRoot(projectRoot: string, filePath: string): string | null {
  const root = path.resolve(projectRoot);
  const resolved = path.resolve(path.isAbsolute(filePath) ? filePath : path.join(root, filePath));
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}
