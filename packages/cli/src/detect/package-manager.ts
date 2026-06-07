import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function detectPackageManager(cwd: string): PackageManager {
  const pkgPath = path.join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { packageManager?: string };
      const pm = pkg.packageManager?.split("@")[0];
      if (pm === "npm" || pm === "pnpm" || pm === "yarn" || pm === "bun") {
        return pm;
      }
    } catch {
      // fall through
    }
  }

  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(cwd, "bun.lockb")) || existsSync(path.join(cwd, "bun.lock")))
    return "bun";
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

export function installCommand(pm: PackageManager): string[] {
  switch (pm) {
    case "pnpm":
      return ["pnpm", "add", "-D", "@handlemotion/literature"];
    case "yarn":
      return ["yarn", "add", "-D", "@handlemotion/literature"];
    case "bun":
      return ["bun", "add", "-d", "@handlemotion/literature"];
    default:
      return ["npm", "install", "--save-dev", "@handlemotion/literature"];
  }
}
