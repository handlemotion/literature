import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { detectFramework, type Framework, type FrameworkInfo } from "../detect/framework.js";
import {
  detectPackageManager,
  installCommand,
  type PackageManager,
} from "../detect/package-manager.js";
import { patchNextProject } from "../patch/next.js";
import { patchViteProject } from "../patch/vite.js";
import { resolveWithinRoot } from "../utils/paths.js";

export interface InitOptions {
  cwd: string;
  force: boolean;
  framework?: Framework;
  packageManager?: PackageManager;
  appDir?: string;
  skipInstall: boolean;
}

function hasReactGrab(cwd: string): boolean {
  const pkgPath = path.join(cwd, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Boolean(deps["react-grab"] || deps["grab"]);
  } catch {
    return false;
  }
}

function runInstall(cwd: string, pm: PackageManager): void {
  const [bin, ...args] = installCommand(pm);
  const result = spawnSync(bin!, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Failed to install @handlemotion/literature using ${pm}.`);
  }
}

function resolveAppDir(cwd: string, appDir?: string): string | undefined {
  if (!appDir) return undefined;
  const resolved = resolveWithinRoot(cwd, appDir);
  if (!existsSync(resolved)) {
    throw new Error(`App directory does not exist: ${resolved}`);
  }
  return resolved;
}

function withAppDir(info: FrameworkInfo, appDir?: string): FrameworkInfo {
  if (!appDir) return info;
  return { ...info, appDir, isMonorepo: true };
}

export async function runInit(options: InitOptions): Promise<void> {
  const cwd = path.resolve(options.cwd);

  if (!existsSync(path.join(cwd, "package.json"))) {
    throw new Error("No package.json found. Run this command from your project root.");
  }

  const appDir = resolveAppDir(cwd, options.appDir);
  const detected =
    detectFramework(appDir ?? cwd, options.framework, cwd) ??
    detectFramework(cwd, options.framework, cwd);
  if (!detected) {
    throw new Error(
      "Could not detect Next.js or Vite. Use --framework next|vite or run from your project root.",
    );
  }

  const info = withAppDir(detected, appDir);

  if (hasReactGrab(cwd)) {
    console.warn(
      "Warning: react-grab detected. Literature and React Grab share a shortcut — do not run both on Alt+Shift+L.",
    );
  }

  const pm = options.packageManager ?? detectPackageManager(cwd);

  if (!options.skipInstall) {
    console.log(`Installing @handlemotion/literature with ${pm}...`);
    runInstall(cwd, pm);
  }

  const patchedFiles =
    info.framework === "next"
      ? patchNextProject(cwd, info, { appDir, force: options.force }).files
      : patchViteProject(cwd, { force: options.force }).files;

  console.log("\nLiterature initialized.");
  if (patchedFiles.length > 0) {
    console.log("Updated:");
    for (const file of patchedFiles) {
      console.log(`  - ${path.relative(cwd, file)}`);
    }
  } else {
    console.log("No files changed (already configured). Use --force to overwrite.");
  }
  console.log("\nStart your dev server, then press Alt+Shift+L to toggle edit mode.");

  if (info.framework === "vite") {
    console.log(
      "\nNote: Vite integration instruments JSX but does not start the patch server. Use Next.js for full file-write support in v1.",
    );
  }
}
