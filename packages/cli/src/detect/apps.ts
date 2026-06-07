import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import {
  detectFramework,
  findNextConfigFile,
  findViteConfigFile,
  isMonorepoRoot,
  type Framework,
  type FrameworkInfo,
} from "./framework.js";
import { resolveWithinRoot } from "../utils/paths.js";

const WORKSPACE_DIRS = ["apps", "packages"] as const;

export interface AppCandidate {
  relPath: string;
  absPath: string;
  framework: Framework;
  frameworkInfo: FrameworkInfo;
}

export interface ResolvedAppTarget {
  appRoot: string;
  installCwd: string;
  frameworkInfo: FrameworkInfo;
  relPath?: string;
}

function hasFrameworkConfig(dir: string): boolean {
  return Boolean(findNextConfigFile(dir) ?? findViteConfigFile(dir));
}

export function discoverApps(monorepoRoot: string): AppCandidate[] {
  const candidates: AppCandidate[] = [];

  for (const workspaceDir of WORKSPACE_DIRS) {
    const workspacePath = path.join(monorepoRoot, workspaceDir);
    if (!existsSync(workspacePath)) continue;

    for (const entry of readdirSync(workspacePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const absPath = path.join(workspacePath, entry.name);
      if (!hasFrameworkConfig(absPath)) continue;

      const info = detectFramework(absPath, undefined, monorepoRoot);
      if (!info) continue;

      candidates.push({
        relPath: path.join(workspaceDir, entry.name).replace(/\\/g, "/"),
        absPath,
        framework: info.framework,
        frameworkInfo: { ...info, isMonorepo: true },
      });
    }
  }

  return candidates.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

async function pickAppInteractive(apps: AppCandidate[]): Promise<AppCandidate> {
  console.log("Multiple apps found:");
  for (const [index, app] of apps.entries()) {
    console.log(`  ${index + 1}. ${app.relPath} (${app.framework})`);
  }

  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const answer = await rl.question("Select app (number): ");
      const choice = Number.parseInt(answer.trim(), 10);
      if (Number.isFinite(choice) && choice >= 1 && choice <= apps.length) {
        return apps[choice - 1]!;
      }
      console.log(`Enter a number between 1 and ${apps.length}.`);
    }
  } finally {
    rl.close();
  }
}

function pickAppNonInteractive(apps: AppCandidate[]): never {
  const list = apps.map((app, index) => `  ${index + 1}. ${app.relPath} (${app.framework})`).join("\n");
  throw new Error(`Multiple apps found. Pass --app-dir:\n${list}`);
}

async function pickApp(apps: AppCandidate[]): Promise<AppCandidate> {
  if (apps.length === 1) return apps[0]!;
  if (process.stdin.isTTY) return pickAppInteractive(apps);
  return pickAppNonInteractive(apps);
}

function resolveInstallCwd(appPackageDir: string, monorepoRoot: string): string {
  return existsSync(path.join(appPackageDir, "package.json")) ? appPackageDir : monorepoRoot;
}

export async function resolveAppTarget(
  cwd: string,
  options: { appDir?: string; framework?: Framework },
): Promise<ResolvedAppTarget> {
  if (options.appDir) {
    const absAppDir = resolveWithinRoot(cwd, options.appDir);
    if (!existsSync(absAppDir)) {
      throw new Error(`App directory does not exist: ${absAppDir}`);
    }

    const info = detectFramework(absAppDir, options.framework, cwd);
    if (!info) {
      throw new Error(
        `Could not detect Next.js or Vite in ${options.appDir}. Use --framework next|vite.`,
      );
    }

    return {
      appRoot: info.appDir,
      installCwd: resolveInstallCwd(absAppDir, cwd),
      frameworkInfo: { ...info, isMonorepo: isMonorepoRoot(cwd) || Boolean(options.appDir) },
      relPath: options.appDir.replace(/\\/g, "/"),
    };
  }

  const atCwd = detectFramework(cwd, options.framework, cwd);
  if (atCwd && hasFrameworkConfig(cwd)) {
    return {
      appRoot: atCwd.appDir,
      installCwd: cwd,
      frameworkInfo: atCwd,
    };
  }

  if (!isMonorepoRoot(cwd)) {
    throw new Error(
      "Could not detect Next.js or Vite. Use --framework next|vite or run from your project root.",
    );
  }

  const discovered = discoverApps(cwd).filter(
    (app) => !options.framework || app.framework === options.framework,
  );

  if (discovered.length === 0) {
    throw new Error(
      "No Next.js or Vite apps found in apps/* or packages/*. Run from an app directory or pass --app-dir.",
    );
  }

  const selected = await pickApp(discovered);
  if (discovered.length > 1) {
    console.log(`Detected app: ${selected.relPath}`);
  } else {
    console.log(`Detected app: ${selected.relPath}`);
  }

  return {
    appRoot: selected.frameworkInfo.appDir,
    installCwd: resolveInstallCwd(selected.absPath, cwd),
    frameworkInfo: selected.frameworkInfo,
    relPath: selected.relPath,
  };
}
