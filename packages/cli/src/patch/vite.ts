import { readFileSync } from "node:fs";
import { findViteConfigFile } from "../detect/framework.js";
import { writeTextFile } from "./io.js";
import type { PatchOptions } from "./types.js";

const PLUGIN_CONFIGURED = /createLiteraturePlugin\.vite\s*\(/;

export function patchViteProject(cwd: string, options: PatchOptions): { files: string[] } {
  const configPath = findViteConfigFile(cwd);
  if (!configPath) {
    throw new Error("Could not find vite.config.* in project root.");
  }

  let content = readFileSync(configPath, "utf-8");
  if (PLUGIN_CONFIGURED.test(content) && !options.force) {
    return { files: [] };
  }

  let changed = false;

  if (!content.includes("@handlemotion/literature/vite")) {
    content = `import { createLiteraturePlugin } from "@handlemotion/literature/vite";\n` + content;
    changed = true;
  }

  if (!PLUGIN_CONFIGURED.test(content)) {
    if (/plugins:\s*\[/.test(content)) {
      content = content.replace(
        /plugins:\s*\[/,
        "plugins: [createLiteraturePlugin.vite({ projectRoot: process.cwd() }), ",
      );
      changed = true;
    } else if (/defineConfig\s*\(\s*\{/.test(content)) {
      content = content.replace(
        /defineConfig\s*\(\s*\{/,
        "defineConfig({\n  plugins: [createLiteraturePlugin.vite({ projectRoot: process.cwd() })],",
      );
      changed = true;
    } else {
      throw new Error(
        "Could not patch vite.config: add createLiteraturePlugin.vite({ projectRoot: process.cwd() }) to plugins manually.",
      );
    }
  }

  if (!changed) {
    return { files: [] };
  }

  if (writeTextFile(configPath, content, options)) {
    return { files: [configPath] };
  }

  return { files: [] };
}
