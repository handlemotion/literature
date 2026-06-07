import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { LiteratureManifest } from "../core/index.js";

export const manifest: LiteratureManifest = { version: 1, targets: {} };

let manifestProjectRoot: string | null = null;

export function setManifestProjectRoot(projectRoot: string): void {
  manifestProjectRoot = path.resolve(projectRoot);
}

function manifestFilePath(): string | null {
  return manifestProjectRoot ? path.join(manifestProjectRoot, ".literature", "manifest.json") : null;
}

function persistManifestToDisk(): void {
  const filePath = manifestFilePath();
  if (!filePath) return;
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(getManifestSnapshot()));
}

export function mergeTargets(targets: LiteratureManifest["targets"]): void {
  Object.assign(manifest.targets, targets);
  persistManifestToDisk();
}

export function resetManifestState(): void {
  manifest.targets = {};
  persistManifestToDisk();
}

export function readManifestFromDisk(projectRoot: string): LiteratureManifest | null {
  const filePath = path.join(path.resolve(projectRoot), ".literature", "manifest.json");
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as LiteratureManifest;
  } catch {
    return null;
  }
}

export function getManifestSnapshot(): LiteratureManifest {
  return {
    version: manifest.version,
    targets: { ...manifest.targets },
  };
}
