import { existsSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import {
  detectFramework,
  findNextConfigFile,
  findViteConfigFile,
  isMonorepoRoot,
  type Framework,
  type FrameworkInfo,
} from "./framework.js";

const WORKSPACE_DIRS = ["apps", "packages"] as const;

export interface CompatibleApp {
  relPath: string;
  framework: Framework;
}

export interface ResolvedAppTarget {
  installCwd: string;
  frameworkInfo: FrameworkInfo;
}

function hasFrameworkConfig(dir: string): boolean {
  return Boolean(findNextConfigFile(dir) ?? findViteConfigFile(dir));
}

function isUnderRoot(root: string, target: string): boolean {
  try {
    const resolvedRoot = realpathSync.native(path.resolve(root));
    const resolvedTarget = realpathSync.native(path.resolve(target));
    const rel = path.relative(resolvedRoot, resolvedTarget);
    return !rel.startsWith("..") && !path.isAbsolute(rel);
  } catch {
    return false;
  }
}

export function listCompatibleApps(monorepoRoot: string): CompatibleApp[] {
  const candidates: CompatibleApp[] = [];
  const resolvedRoot = path.resolve(monorepoRoot);

  for (const workspaceDir of WORKSPACE_DIRS) {
    const workspacePath = path.join(resolvedRoot, workspaceDir);
    if (!existsSync(workspacePath)) continue;

    for (const entry of readdirSync(workspacePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const absPath = path.join(workspacePath, entry.name);
      let resolvedPath: string;
      try {
        resolvedPath = realpathSync.native(absPath);
      } catch {
        continue;
      }

      if (!isUnderRoot(resolvedRoot, resolvedPath) || !hasFrameworkConfig(resolvedPath)) {
        continue;
      }

      const info = detectFramework(resolvedPath);
      if (!info) continue;

      candidates.push({
        relPath: path.join(workspaceDir, entry.name).replace(/\\/g, "/"),
        framework: info.framework,
      });
    }
  }

  return candidates.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function monorepoRootError(cwd: string, framework?: Framework): never {
  const apps = listCompatibleApps(cwd).filter(
    (app) => !framework || app.framework === framework,
  );
  const lines = apps.map((app) => `  cd ${app.relPath} && literature init`);
  throw new Error(
    `Run from an app directory, not the monorepo root.\n\nCompatible apps:\n${lines.join("\n") || "  (none found under apps/* or packages/*)"}`,
  );
}

export function resolveAppTarget(
  cwd: string,
  options: { framework?: Framework } = {},
): ResolvedAppTarget {
  if (isMonorepoRoot(cwd)) {
    monorepoRootError(cwd, options.framework);
  }

  const info = detectFramework(cwd, options.framework);
  if (info && hasFrameworkConfig(cwd)) {
    return {
      installCwd: cwd,
      frameworkInfo: info,
    };
  }

  throw new Error(
    "Could not detect Next.js or Vite. Run from your app directory (where next.config or vite.config lives).",
  );
}
