import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { FrameworkInfo } from "../detect/framework.js";
import { detectNextRouter, findNextConfigFile } from "../detect/framework.js";
import { DEVTOOLS_TEMPLATE } from "../templates/devtools.js";

const WRAPPED_CONFIG =
  /(?:const|let|var)\s+\w+\s*=\s*withLiterature\s*\(|export\s+default\s+withLiterature\s*\(/;

function isLiteratureConfigured(content: string): boolean {
  return WRAPPED_CONFIG.test(content);
}

function writeIfMissing(filePath: string, content: string, force: boolean): boolean {
  if (existsSync(filePath) && !force) {
    return false;
  }
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf-8");
  return true;
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
  options: { appDir?: string; isMonorepo: boolean; force: boolean },
): boolean {
  let content = existsSync(configPath) ? readFileSync(configPath, "utf-8") : "";

  if (isLiteratureConfigured(content) && !options.force) {
    return false;
  }

  const isTs = configPath.endsWith(".ts");
  const { expr: opts, pathImport } = literatureOptionsExpr(cwd, appRoot, options, isTs);
  const importLine = `import { withLiterature } from "@handlemotion/literature";\n`;

  if (!content.trim()) {
    content = `${pathImport}${importLine}\n/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default withLiterature(nextConfig, ${opts});\n`;
    writeFileSync(configPath, content, "utf-8");
    return true;
  }

  if (isLiteratureConfigured(content)) {
    return false;
  }

  if (!content.includes('@handlemotion/literature"')) {
    content =
      importLine + (pathImport && !content.includes("node:path") ? pathImport : "") + content;
  }

  const defaultExport = content.match(/export\s+default\s+(\w+);?\s*$/m);
  if (defaultExport?.[1]) {
    content = content.replace(
      /export\s+default\s+\w+;?\s*$/m,
      `export default withLiterature(${defaultExport[1]}, ${opts});`,
    );
  } else if (/export\s+default\s*\{/.test(content)) {
    content = content.replace(/export\s+default\s*(\{[\s\S]*\});?\s*$/m, (_, config) => {
      return `export default withLiterature(${config}, ${opts});`;
    });
  } else {
    content += `\nexport default withLiterature({}, ${opts});\n`;
  }

  if (pathImport && !content.includes("node:path") && isTs) {
    content = pathImport + content;
  }

  writeFileSync(configPath, content, "utf-8");
  return true;
}

function patchLayout(layoutPath: string, devtoolsImportPath: string, force: boolean): boolean {
  if (!existsSync(layoutPath)) return false;

  let content = readFileSync(layoutPath, "utf-8");
  if (content.includes("LiteratureDevtoolsLoader") && !force) {
    return false;
  }

  if (!content.includes(devtoolsImportPath)) {
    content = `import { LiteratureDevtoolsLoader } from "${devtoolsImportPath}";\n` + content;
  }

  if (content.includes("</body>")) {
    content = content.replace("</body>", "        <LiteratureDevtoolsLoader />\n      </body>");
  } else {
    content += `\n<LiteratureDevtoolsLoader />\n`;
  }

  writeFileSync(layoutPath, content, "utf-8");
  return true;
}

export function patchNextProject(
  cwd: string,
  info: FrameworkInfo,
  options: { appDir?: string; force: boolean },
): { files: string[] } {
  const files: string[] = [];
  const appRoot = options.appDir ?? info.appDir;
  const nextRouter = options.appDir ? detectNextRouter(appRoot) : (info.nextRouter ?? "app");
  const monorepo = info.isMonorepo || Boolean(options.appDir);

  let configPath = findNextConfigFile(appRoot) ?? findNextConfigFile(cwd);
  if (!configPath) {
    configPath = path.join(appRoot, "next.config.ts");
    writeFileSync(configPath, "", "utf-8");
  }

  if (
    patchNextConfig(configPath, cwd, appRoot, {
      appDir: options.appDir,
      isMonorepo: monorepo,
      force: options.force,
    })
  ) {
    files.push(configPath);
  }

  const devtoolsDir =
    nextRouter === "pages" ? path.join(appRoot, "components") : path.join(appRoot, "app");
  const devtoolsPath = path.join(devtoolsDir, "literature-devtools.tsx");
  if (writeIfMissing(devtoolsPath, DEVTOOLS_TEMPLATE, options.force)) {
    files.push(devtoolsPath);
  }

  const devtoolsImport =
    nextRouter === "pages" ? "../components/literature-devtools" : "./literature-devtools";

  if (nextRouter === "app") {
    const layoutPath = path.join(appRoot, "app", "layout.tsx");
    const layoutJsx = path.join(appRoot, "app", "layout.jsx");
    const layout = existsSync(layoutPath) ? layoutPath : existsSync(layoutJsx) ? layoutJsx : null;
    if (layout && patchLayout(layout, devtoolsImport, options.force)) {
      files.push(layout);
    }
  } else {
    const docPath = path.join(appRoot, "pages", "_document.tsx");
    const docJsx = path.join(appRoot, "pages", "_document.jsx");
    const doc = existsSync(docPath) ? docPath : existsSync(docJsx) ? docJsx : null;
    if (doc && patchLayout(doc, devtoolsImport, options.force)) {
      files.push(doc);
    }
  }

  return { files };
}
