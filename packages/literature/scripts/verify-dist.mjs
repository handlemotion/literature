import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const leakedRuntime = /@handlemotion\/literature-(core|compiler|client|next)/;
const leakedTypes = /@handlemotion\/literature-(compiler|client|next)/;

const requiredArtifacts = [
  "index.js",
  "index.d.ts",
  "devtools.js",
  "devtools.d.ts",
  "client/LiteratureChrome.js",
  "next/LiteratureDev.js",
  "vite.js",
  "vite.d.ts",
  "lit.js",
  "lit.d.ts",
  "types.js",
  "types.d.ts",
  "literature-loader.cjs",
];

function assertArtifactsExist() {
  if (!existsSync(distDir)) {
    throw new Error("dist/ missing — run pnpm build in packages/literature first");
  }

  for (const rel of requiredArtifacts) {
    const full = path.join(distDir, rel);
    if (!existsSync(full)) {
      throw new Error(`required dist artifact missing: ${rel}`);
    }
  }
}

function assertExportTargetsExist() {
  const pkgRoot = path.join(distDir, "..");
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (subpath === "./package.json") continue;
    const spec = target.import ?? target.require;
    if (!spec || typeof spec !== "string") continue;
    const full = path.join(pkgRoot, spec.replace(/^\.\//, ""));
    if (!existsSync(full)) {
      throw new Error(`package.json export "${subpath}" points to missing file: ${spec}`);
    }
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else checkFile(full);
  }
}

function checkFile(file) {
  if (file.endsWith(".map")) {
    throw new Error(`sourcemap must not ship: ${path.relative(distDir, file)}`);
  }

  const text = readFileSync(file, "utf-8");
  const rel = path.relative(distDir, file);

  if (/\.(js|cjs)$/.test(file) && leakedRuntime.test(text)) {
    throw new Error(`runtime dist leaks private workspace import in ${rel}`);
  }

  if (file.endsWith(".d.ts") && leakedTypes.test(text)) {
    throw new Error(`types dist leaks unpublished package in ${rel}`);
  }
}

assertArtifactsExist();
assertExportTargetsExist();
walk(distDir);
console.log("dist verification passed");
