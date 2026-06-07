import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveAppTarget } from "../detect/apps.js";
import {
  detectPackageManager,
  installCommand,
  type PackageManager,
} from "../detect/package-manager.js";
import { patchNextProject } from "../patch/next.js";
import { patchViteProject } from "../patch/vite.js";

export interface InitOptions {
  cwd: string;
  force: boolean;
  framework?: "next" | "vite";
  packageManager?: PackageManager;
  appDir?: string;
  skipInstall: boolean;
  dryRun?: boolean;
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

function printInstallPlan(installCwd: string, pm: PackageManager): void {
  const [bin, ...args] = installCommand(pm);
  console.log(`Would install in ${installCwd}:\n  ${[bin, ...args].join(" ")}`);
}

export async function runInit(options: InitOptions): Promise<void> {
  const cwd = path.resolve(options.cwd);

  if (!existsSync(path.join(cwd, "package.json"))) {
    throw new Error("No package.json found. Run this command from your project root.");
  }

  const target = await resolveAppTarget(cwd, {
    appDir: options.appDir,
    framework: options.framework,
  });

  if (hasReactGrab(target.installCwd)) {
    console.warn(
      "Warning: react-grab detected. Literature and React Grab share a shortcut — do not run both on Alt+Shift+L.",
    );
  }

  const pm = options.packageManager ?? detectPackageManager(cwd);
  const patchOpts = { force: options.force, dryRun: options.dryRun, root: cwd };
  const shouldPreviewInstall = options.dryRun && !options.skipInstall;
  const shouldRunInstall = !options.dryRun && !options.skipInstall;

  if (shouldPreviewInstall) {
    printInstallPlan(target.installCwd, pm);
  } else if (shouldRunInstall) {
    console.log(`Installing @handlemotion/literature with ${pm} in ${target.installCwd}...`);
    runInstall(target.installCwd, pm);
  }

  const patchedFiles =
    target.frameworkInfo.framework === "next"
      ? patchNextProject(cwd, target.frameworkInfo, {
          appDir: target.relPath,
          appRoot: target.appRoot,
          ...patchOpts,
        }).files
      : patchViteProject(target.appRoot, patchOpts).files;

  if (options.dryRun) {
    console.log("\nDry run — no changes made.");
  } else {
    console.log("\nLiterature initialized.");
  }

  const label = options.dryRun ? "Would update:" : "Updated:";
  const emptyMsg = options.dryRun
    ? "No files would change (already configured). Use --force to refresh config options."
    : "No files changed (already configured). Use --force to refresh config options.";
  if (patchedFiles.length > 0) {
    console.log(label);
    for (const file of patchedFiles) {
      console.log(`  - ${path.relative(cwd, file)}`);
    }
  } else {
    console.log(emptyMsg);
  }

  const layoutPatched = patchedFiles.some((file) => /layout\.(tsx|jsx)$/.test(file));
  if (!layoutPatched) {
    console.log("\nAdd to your root layout:");
    console.log('  import { Literature } from "@handlemotion/literature/devtools";');
    console.log("  <Literature />");
  }

  console.log("\nStart your dev server, then press Alt+Shift+L to toggle edit mode.");

  if (target.frameworkInfo.framework === "vite") {
    console.log(
      "\nNote: Vite integration instruments JSX but does not start the patch server. Use Next.js for full file-write support in v1.",
    );
  }
}
