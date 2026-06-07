import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const leakedRuntime = /@handlemotion\/literature-(core|compiler|client|next)/;
const leakedTypes = /@handlemotion\/literature-(compiler|client|next)/;

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

walk(distDir);
console.log("dist verification passed");
