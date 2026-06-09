import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const NEXT_CONFIG_FILES = [
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
  "next.config.cjs",
] as const;
const VITE_CONFIG_FILES = [
  "vite.config.ts",
  "vite.config.mjs",
  "vite.config.js",
  "vite.config.cjs",
] as const;

function hasWorkspacePackages(workspaces: unknown): boolean {
  if (Array.isArray(workspaces)) {
    return workspaces.length > 0;
  }
  if (workspaces && typeof workspaces === "object" && "packages" in workspaces) {
    const packages = (workspaces as { packages?: unknown }).packages;
    return Array.isArray(packages) && packages.length > 0;
  }
  return false;
}

export function isMonorepoRoot(cwd: string): boolean {
  const workspaceFile = path.join(cwd, "pnpm-workspace.yaml");
  if (existsSync(workspaceFile)) {
    const content = readFileSync(workspaceFile, "utf-8");
    if (/packages\/\*|apps\/\*|packages\/|apps\//.test(content)) {
      return true;
    }
  }

  const pkgPath = path.join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { workspaces?: unknown };
      if (hasWorkspacePackages(pkg.workspaces)) {
        return true;
      }
    } catch {
      // ignore invalid package.json
    }
  }

  return (
    existsSync(path.join(cwd, "turbo.json")) &&
    (existsSync(path.join(cwd, "packages")) || existsSync(path.join(cwd, "apps")))
  );
}

export type Framework = "next" | "vite";
export type NextRouter = "app" | "pages";

export interface FrameworkInfo {
  framework: Framework;
  appDir: string;
}

function findConfigFile(cwd: string, files: readonly string[]): string | null {
  for (const file of files) {
    const full = path.join(cwd, file);
    if (existsSync(full)) return full;
  }
  return null;
}

function hasConfig(cwd: string, files: readonly string[]): boolean {
  return findConfigFile(cwd, files) !== null;
}

export function detectNextRouter(searchDir: string): NextRouter {
  if (existsSync(path.join(searchDir, "app")) || existsSync(path.join(searchDir, "src", "app"))) {
    return "app";
  }
  if (
    existsSync(path.join(searchDir, "pages")) ||
    existsSync(path.join(searchDir, "src", "pages"))
  ) {
    return "pages";
  }
  return "app";
}

function resolveNextAppDir(cwd: string): string {
  if (
    existsSync(path.join(cwd, "app")) ||
    existsSync(path.join(cwd, "src", "app")) ||
    existsSync(path.join(cwd, "pages")) ||
    existsSync(path.join(cwd, "src", "pages"))
  ) {
    if (existsSync(path.join(cwd, "src", "app")) || existsSync(path.join(cwd, "src", "pages"))) {
      return path.join(cwd, "src");
    }
    return cwd;
  }
  return cwd;
}

export function detectFramework(cwd: string, override?: Framework): FrameworkInfo | null {
  if (override === "next" || (!override && hasConfig(cwd, NEXT_CONFIG_FILES))) {
    return { framework: "next", appDir: resolveNextAppDir(cwd) };
  }

  if (override === "vite" || (!override && hasConfig(cwd, VITE_CONFIG_FILES))) {
    return { framework: "vite", appDir: cwd };
  }

  return null;
}

export function findNextConfigFile(cwd: string): string | null {
  return findConfigFile(cwd, NEXT_CONFIG_FILES);
}

export function findViteConfigFile(cwd: string): string | null {
  return findConfigFile(cwd, VITE_CONFIG_FILES);
}
