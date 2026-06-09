import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

const TURBOPACK_PROJECT_PREFIX = "[project]/";

function resolveRealPath(target: string): string {
  try {
    return realpathSync.native(target);
  } catch {
    return path.resolve(target);
  }
}

/** App Router source root under the package (handles `src/app` layouts). */
export function resolveAppRoot(projectRoot: string): string {
  const root = path.resolve(projectRoot);
  const srcApp = path.join(root, "src", "app");
  if (existsSync(srcApp)) return path.join(root, "src");
  return root;
}

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
  const resolvedFile = resolveRealPath(file);
  const resolvedRoot = resolveRealPath(root);
  const rel = path.relative(resolvedRoot, resolvedFile);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
