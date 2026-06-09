import { readFileSync } from "node:fs";
import path from "node:path";
import type { LiteratureManifest } from "../core/index.js";

const TOKEN_HEADER = "x-literature-token";

function readPatchServerPort(projectRoot: string): number | null {
  const portFile = path.join(path.resolve(projectRoot), ".literature", "port");
  try {
    const port = Number(readFileSync(portFile, "utf-8").trim());
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

function readPatchServerToken(projectRoot: string): string | null {
  const tokenFile = path.join(path.resolve(projectRoot), ".literature", "token");
  try {
    const token = readFileSync(tokenFile, "utf-8").trim();
    return token || null;
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
  const token = readPatchServerToken(projectRoot);
  if (!port || !token) {
    return;
  }

  try {
    await fetch(`http://127.0.0.1:${port}/manifest/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [TOKEN_HEADER]: token,
      },
      body: JSON.stringify({ targets }),
      signal: AbortSignal.timeout(500),
    });
  } catch {
    // Patch server may still be starting; manifest sync is best-effort in dev.
  }
}
