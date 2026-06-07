import { readFileSync } from "node:fs";
import path from "node:path";
import type { LiteratureManifest } from "../core/index.js";

function readPatchServerPort(projectRoot: string): number | null {
  const portFile = path.join(path.resolve(projectRoot), ".literature", "port");
  try {
    const port = Number(readFileSync(portFile, "utf-8").trim());
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

export async function registerManifestTargets(
  projectRoot: string,
  targets: LiteratureManifest["targets"],
): Promise<void> {
  if (Object.keys(targets).length === 0) {
    return;
  }

  const port = readPatchServerPort(projectRoot);
  if (!port) {
    return;
  }

  try {
    await fetch(`http://127.0.0.1:${port}/manifest/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targets }),
      signal: AbortSignal.timeout(500),
    });
  } catch {
    // Patch server may still be starting; manifest sync is best-effort in dev.
  }
}
