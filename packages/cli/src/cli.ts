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
    "skip-install": { type: "boolean" },
    "dry-run": { type: "boolean" },
    cwd: { type: "string", short: "c" },
  },
});

function printHelp(): void {
  console.log(`@handlemotion/literature-cli

Usage:
  literature init [options]

Run from the app package (where next.config or vite.config lives).
From a monorepo root, the CLI lists apps under apps/* and packages/* and exits.

Options:
  -y, --yes                Non-interactive (default)
  --force                  Re-apply Literature config when already wrapped
  -f, --framework <next|vite>  Framework override
  -p, --package-manager <pm>   npm | pnpm | yarn | bun
  --skip-install           Patch files only, skip package install
  --dry-run                Preview install and patches without making changes
  -c, --cwd <path>         Working directory (default: process.cwd())
  -h, --help               Show help

Examples:
  cd apps/web && literature init
  literature init --dry-run
  literature init --dry-run --skip-install
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
      skipInstall: values["skip-install"] ?? false,
      dryRun: values["dry-run"] ?? false,
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
