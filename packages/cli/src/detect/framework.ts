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

function isMonorepoRoot(cwd: string): boolean {
  const workspaceFile = path.join(cwd, "pnpm-workspace.yaml");
  if (existsSync(workspaceFile)) {
    const content = readFileSync(workspaceFile, "utf-8");
    if (/packages\/\*|apps\/\*|packages\/|apps\//.test(content)) {
      return true;
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
  nextRouter?: NextRouter;
  appDir: string;
  isMonorepo: boolean;
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

function resolveNextAppDir(cwd: string): { nextRouter: NextRouter; appDir: string } {
  if (existsSync(path.join(cwd, "app"))) {
    return { nextRouter: "app", appDir: cwd };
  }
  if (existsSync(path.join(cwd, "src", "app"))) {
    return { nextRouter: "app", appDir: path.join(cwd, "src") };
  }
  if (existsSync(path.join(cwd, "pages"))) {
    return { nextRouter: "pages", appDir: cwd };
  }
  if (existsSync(path.join(cwd, "src", "pages"))) {
    return { nextRouter: "pages", appDir: path.join(cwd, "src") };
  }
  return { nextRouter: "app", appDir: cwd };
}

export function detectFramework(
  cwd: string,
  override?: Framework,
  monorepoRoot: string = cwd,
): FrameworkInfo | null {
  const isMonorepo = isMonorepoRoot(monorepoRoot);

  if (override === "next" || (!override && hasConfig(cwd, NEXT_CONFIG_FILES))) {
    const { nextRouter, appDir } = resolveNextAppDir(cwd);
    return { framework: "next", nextRouter, appDir, isMonorepo };
  }

  if (override === "vite" || (!override && hasConfig(cwd, VITE_CONFIG_FILES))) {
    return { framework: "vite", appDir: cwd, isMonorepo };
  }

  return null;
}

export function findNextConfigFile(cwd: string): string | null {
  return findConfigFile(cwd, NEXT_CONFIG_FILES);
}

export function findViteConfigFile(cwd: string): string | null {
  return findConfigFile(cwd, VITE_CONFIG_FILES);
}
