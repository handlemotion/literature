import type { LiteratureManifest } from "@handleui/literature-core";

export const manifest: LiteratureManifest = { version: 1, targets: {} };

export function mergeTargets(targets: LiteratureManifest["targets"]): void {
  Object.assign(manifest.targets, targets);
}

export function resetManifestState(): void {
  manifest.targets = {};
}

export function getManifestSnapshot(): LiteratureManifest {
  return {
    version: manifest.version,
    targets: { ...manifest.targets },
  };
}
