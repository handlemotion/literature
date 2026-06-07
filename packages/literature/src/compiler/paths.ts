import path from "node:path";

const TURBOPACK_PROJECT_PREFIX = "[project]/";

/** Resolve turbopack virtual paths like `[project]/apps/demo/app/page.tsx`. */
export function normalizeResourcePath(resourcePath: string, projectRoot: string): string {
  const markerIndex = resourcePath.indexOf(TURBOPACK_PROJECT_PREFIX);
  if (markerIndex >= 0) {
    const rel = resourcePath.slice(markerIndex + TURBOPACK_PROJECT_PREFIX.length);
    return path.join(path.resolve(projectRoot), rel);
  }
  return path.resolve(resourcePath);
}

export function isUnderDir(file: string, root: string): boolean {
  const resolvedFile = path.resolve(file);
  const resolvedRoot = path.resolve(root);
  const rel = path.relative(resolvedRoot, resolvedFile);
  return Boolean(rel) && !rel.startsWith("..") && !path.isAbsolute(rel);
}
