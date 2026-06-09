import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { FrameworkInfo } from "../detect/framework.js";
import { detectNextRouter, findNextConfigFile } from "../detect/framework.js";
import { ensureEmptyFile, writeTextFile } from "./io.js";
import type { PatchOptions } from "./types.js";

const WRAPPED_CONFIG =
  /(?:const|let|var)\s+\w+\s*=\s*withLiterature\s*\(|export\s+default\s+withLiterature\s*\(/;

const LITERATURE_DEVTOOLS_IMPORT = '@handlemotion/literature/devtools"';
const LITERATURE_MARKER = "<Literature />";

function isLiteratureConfigured(content: string): boolean {
  return WRAPPED_CONFIG.test(content);
}

function literatureOptionsExpr(): { expr: string; pathImport: string } {
  return { expr: `{ projectRoot: process.cwd() }`, pathImport: "" };
}

function patchNextConfig(configPath: string, options: PatchOptions): boolean {
  let content = existsSync(configPath) ? readFileSync(configPath, "utf-8") : "";

  if (isLiteratureConfigured(content) && !options.force) {
    return false;
  }

  const { expr: opts, pathImport } = literatureOptionsExpr();
  const importLine = `import { withLiterature } from "@handlemotion/literature";\n`;

  if (isLiteratureConfigured(content) && options.force) {
    const updated = content.replace(
      /withLiterature\(([\s\S]*?),\s*\{[\s\S]*?\}\s*\)/,
      `withLiterature($1, ${opts})`,
    );
    if (updated === content) return Boolean(options.dryRun);
    return writeTextFile(configPath, updated, options);
  }

  if (!content.trim()) {
    content = `${pathImport}${importLine}\n/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default withLiterature(nextConfig, ${opts});\n`;
    return writeTextFile(configPath, content, options);
  }

  if (!content.includes('@handlemotion/literature"')) {
    content =
      importLine + (pathImport && !content.includes("node:path") ? pathImport : "") + content;
  }

  const defaultExport = content.match(/export\s+default\s+(\w+);?\s*$/m);
  if (defaultExport?.[1]) {
    const configName = defaultExport[1];
    content = content.replace(
      /export\s+default\s+\w+;?\s*$/m,
      `export default withLiterature(${configName}, ${opts});`,
    );
  } else if (/export\s+default\s*\{/.test(content)) {
    content = content.replace(
      /export\s+default\s*(\{[\s\S]*\});?\s*$/m,
      (_, config) => `export default withLiterature(${config}, ${opts});`,
    );
  } else {
    content += `\nexport default withLiterature({}, ${opts});\n`;
  }

  if (pathImport && !content.includes("node:path")) {
    content = pathImport + content;
  }

  return writeTextFile(configPath, content, options);
}

function findAppLayout(appDir: string): string | null {
  for (const name of ["layout.tsx", "layout.jsx"]) {
    const candidate = path.join(appDir, "app", name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function patchLayout(layoutPath: string, options: PatchOptions): boolean {
  if (!existsSync(layoutPath)) return false;

  let content = readFileSync(layoutPath, "utf-8");
  if (content.includes(LITERATURE_MARKER) && !options.force) {
    return false;
  }

  if (options.force) {
    content = content
      .replace(/import \{ Literature \} from "@handlemotion\/literature\/devtools";\n?/g, "")
      .replace(/\s*<Literature\s*\/>\n?/g, "");
  }

  if (!content.includes(LITERATURE_DEVTOOLS_IMPORT)) {
    content = `import { Literature } from "@handlemotion/literature/devtools";\n` + content;
  }

  if (content.includes("</body>")) {
    content = content.replace("</body>", "        <Literature />\n      </body>");
  } else {
    content += `\n<Literature />\n`;
  }

  return writeTextFile(layoutPath, content, options);
}

export function patchNextProject(
  cwd: string,
  info: FrameworkInfo,
  options: PatchOptions,
): { files: string[] } {
  const files: string[] = [];
  const appDir = info.appDir;
  const nextRouter = detectNextRouter(appDir);
  const patchOptions = { ...options, root: cwd };

  let configPath = findNextConfigFile(cwd);
  if (!configPath) {
    configPath = path.join(cwd, "next.config.ts");
    ensureEmptyFile(configPath, patchOptions);
  }

  if (patchNextConfig(configPath, patchOptions)) {
    files.push(configPath);
  }

  if (nextRouter === "app") {
    const layout = findAppLayout(appDir);
    if (layout && patchLayout(layout, patchOptions)) {
      files.push(layout);
    }
  } else {
    const docPath = path.join(appDir, "pages", "_document.tsx");
    const docJsx = path.join(appDir, "pages", "_document.jsx");
    const doc = existsSync(docPath) ? docPath : existsSync(docJsx) ? docJsx : null;
    if (doc && patchLayout(doc, patchOptions)) {
      files.push(doc);
    }
  }

  return { files };
}
