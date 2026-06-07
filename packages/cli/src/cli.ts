import { parseArgs } from "node:util";
import { runInit } from "./commands/init.js";
import type { Framework } from "./detect/framework.js";
import type { PackageManager } from "./detect/package-manager.js";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" },
    yes: { type: "boolean", short: "y" },
    force: { type: "boolean" },
    framework: { type: "string", short: "f" },
    "package-manager": { type: "string", short: "p" },
    "app-dir": { type: "string" },
    "skip-install": { type: "boolean" },
    cwd: { type: "string", short: "c" },
  },
});

function printHelp(): void {
  console.log(`@handlemotion/literature-cli

Usage:
  literature init [options]

Options:
  -y, --yes                Non-interactive (default; reserved for future prompts)
  --force                  Overwrite existing Literature config
  -f, --framework <next|vite>  Framework override
  -p, --package-manager <pm>   npm | pnpm | yarn | bun
  --app-dir <path>         App directory in monorepos (relative to cwd)
  --skip-install           Patch files only, skip package install
  -c, --cwd <path>         Working directory (default: process.cwd())
  -h, --help               Show help
`);
}

async function main(): Promise<void> {
  if (values.help) {
    printHelp();
    return;
  }

  const subcommand = positionals[0];
  if (subcommand !== "init") {
    if (!subcommand) {
      printHelp();
      return;
    }
    console.error(`Unknown command: ${subcommand}`);
    printHelp();
    process.exit(1);
  }

  const framework = values.framework as Framework | undefined;
  if (framework && framework !== "next" && framework !== "vite") {
    console.error(`Invalid framework: ${framework}. Use next or vite.`);
    process.exit(1);
  }

  const pm = values["package-manager"] as PackageManager | undefined;
  if (pm && pm !== "npm" && pm !== "pnpm" && pm !== "yarn" && pm !== "bun") {
    console.error(`Invalid package manager: ${pm}.`);
    process.exit(1);
  }

  try {
    await runInit({
      cwd: values.cwd ?? process.cwd(),
      force: values.force ?? false,
      framework,
      packageManager: pm,
      appDir: values["app-dir"],
      skipInstall: values["skip-install"] ?? false,
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
