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

function monorepoRootExpr(appRoot: string, cwd: string): string {
  const projectRootRel = path.relative(appRoot, cwd).replace(/\\/g, "/") || ".";
  return `path.resolve(__dirname, "${projectRootRel}")`;
}

function monorepoDefaultsBlock(appRoot: string, cwd: string): string {
  const rootExpr = monorepoRootExpr(appRoot, cwd);
  return `{
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.localhost"],
  turbopack: {
    root: ${rootExpr},
  },
}`;
}

function wrapConfigWithDefaults(configExpr: string, appRoot: string, cwd: string, isMonorepo: boolean): string {
  if (!isMonorepo) return configExpr;
  return `{ ...${monorepoDefaultsBlock(appRoot, cwd)}, ...${configExpr} }`;
}

function literatureOptionsExpr(
  cwd: string,
  appRoot: string,
  options: { appDir?: string; isMonorepo: boolean },
  isTs: boolean,
): { expr: string; pathImport: string } {
  const useConfigRelative = options.isMonorepo || Boolean(options.appDir);

  if (useConfigRelative) {
    const projectRootRel = path.relative(appRoot, cwd).replace(/\\/g, "/") || ".";
    return {
      expr: `{ projectRoot: path.resolve(__dirname, "${projectRootRel}"), appRoot: __dirname }`,
      pathImport: `import path from "node:path";\nimport { fileURLToPath } from "node:url";\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n`,
    };
  }

  if (appRoot !== cwd) {
    const rel = path.relative(cwd, appRoot).replace(/\\/g, "/");
    if (isTs) {
      return {
        expr: `{ projectRoot: process.cwd(), appRoot: path.join(process.cwd(), "${rel}") }`,
        pathImport: `import path from "node:path";\n`,
      };
    }
    return {
      expr: `{ projectRoot: process.cwd(), appRoot: require("node:path").join(process.cwd(), "${rel}") }`,
      pathImport: "",
    };
  }

  return { expr: `{ projectRoot: process.cwd() }`, pathImport: "" };
}

function patchNextConfig(
  configPath: string,
  cwd: string,
  appRoot: string,
  options: { appDir?: string; isMonorepo: boolean } & PatchOptions,
): boolean {
  let content = existsSync(configPath) ? readFileSync(configPath, "utf-8") : "";

  if (isLiteratureConfigured(content) && !options.force) {
    return false;
  }

  const isTs = configPath.endsWith(".ts");
  const { expr: opts, pathImport } = literatureOptionsExpr(cwd, appRoot, options, isTs);
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
    const configBody = options.isMonorepo ? monorepoDefaultsBlock(appRoot, cwd) : "{}";
    content = `${pathImport}${importLine}\n/** @type {import('next').NextConfig} */\nconst nextConfig = ${configBody};\n\nexport default withLiterature(nextConfig, ${opts});\n`;
    return writeTextFile(configPath, content, options);
  }

  if (!content.includes('@handlemotion/literature"')) {
    content =
      importLine + (pathImport && !content.includes("node:path") ? pathImport : "") + content;
  }

  const defaultExport = content.match(/export\s+default\s+(\w+);?\s*$/m);
  if (defaultExport?.[1]) {
    const configName = defaultExport[1];
    const wrappedConfig = wrapConfigWithDefaults(configName, appRoot, cwd, options.isMonorepo);
    content = content.replace(
      /export\s+default\s+\w+;?\s*$/m,
      `export default withLiterature(${wrappedConfig}, ${opts});`,
    );
  } else if (/export\s+default\s*\{/.test(content)) {
    content = content.replace(/export\s+default\s*(\{[\s\S]*\});?\s*$/m, (_, config) => {
      const wrappedConfig = options.isMonorepo
        ? `{ ...${monorepoDefaultsBlock(appRoot, cwd)}, ...${config} }`
        : config;
      return `export default withLiterature(${wrappedConfig}, ${opts});`;
    });
  } else {
    const configBody = options.isMonorepo ? monorepoDefaultsBlock(appRoot, cwd) : "{}";
    content += `\nexport default withLiterature(${configBody}, ${opts});\n`;
  }

  if (pathImport && !content.includes("node:path") && isTs) {
    content = pathImport + content;
  }

  return writeTextFile(configPath, content, options);
}

function findAppLayout(appRoot: string): string | null {
  const candidates = [
    path.join(appRoot, "app", "layout.tsx"),
    path.join(appRoot, "app", "layout.jsx"),
    path.join(appRoot, "src", "app", "layout.tsx"),
    path.join(appRoot, "src", "app", "layout.jsx"),
  ];

  for (const candidate of candidates) {
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
  options: { appDir?: string; appRoot?: string } & PatchOptions,
): { files: string[] } {
  const files: string[] = [];
  const appRoot = options.appRoot ?? options.appDir ?? info.appDir;
  const nextRouter = detectNextRouter(appRoot);
  const monorepo = info.isMonorepo || Boolean(options.appDir);
  const patchOptions = { ...options, root: cwd };

  let configPath = findNextConfigFile(appRoot) ?? findNextConfigFile(cwd);
  if (!configPath) {
    configPath = path.join(appRoot, "next.config.ts");
    ensureEmptyFile(configPath, patchOptions);
  }

  const configOptions = {
    appDir: options.appDir,
    isMonorepo: monorepo,
    force: options.force,
    dryRun: options.dryRun,
    root: cwd,
  };

  if (patchNextConfig(configPath, cwd, appRoot, configOptions)) {
    files.push(configPath);
  }

  if (nextRouter === "app") {
    const layout = findAppLayout(appRoot);
    if (layout && patchLayout(layout, patchOptions)) {
      files.push(layout);
    }
  } else {
    const docPath = path.join(appRoot, "pages", "_document.tsx");
    const docJsx = path.join(appRoot, "pages", "_document.jsx");
    const doc = existsSync(docPath) ? docPath : existsSync(docJsx) ? docJsx : null;
    if (doc && patchLayout(doc, patchOptions)) {
      files.push(doc);
    }
  }

  return { files };
}
