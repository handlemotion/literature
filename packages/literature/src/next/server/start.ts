import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { handleRequest, literaturePaths } from "./routes.js";

let serverInstance: ReturnType<typeof createServer> | null = null;
let serverUrl = "";

export function getLiteratureServerUrl(): string {
  return serverUrl;
}

export function readLiteratureServerUrlFromDisk(projectRoot: string): string {
  const { portFile } = literaturePaths(projectRoot);
  if (!existsSync(portFile)) {
    return "";
  }
  try {
    const port = Number(readFileSync(portFile, "utf-8").trim());
    if (!Number.isFinite(port) || port <= 0) {
      return "";
    }
    return `http://127.0.0.1:${port}`;
  } catch {
    return "";
  }
}

async function probeHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(500) });
    return res.ok;
  } catch {
    return false;
  }
}

export function startLiteratureServer(projectRoot: string): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (serverInstance) {
    return;
  }

  const { historyPath, portFile, tokenFile } = literaturePaths(projectRoot);
  const literatureDir = path.dirname(historyPath);
  if (!existsSync(literatureDir)) {
    mkdirSync(literatureDir, { recursive: true });
  }

  if (!existsSync(tokenFile)) {
    writeFileSync(tokenFile, randomBytes(32).toString("hex"), "utf-8");
  }

  const server = createServer((req, res) => {
    void handleRequest(req, res, { projectRoot, historyPath, tokenPath: tokenFile });
  });

  server.listen(0, "127.0.0.1", () => {
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    serverUrl = `http://127.0.0.1:${port}`;
    writeFileSync(portFile, String(port), "utf-8");
    console.log(`[literature] patch server ${serverUrl}`);
  });

  serverInstance = server;

  const cleanup = () => {
    server.close();
    serverInstance = null;
    serverUrl = "";
    if (existsSync(portFile)) {
      unlinkSync(portFile);
    }
  };
  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

/** Waits until the patch server responds on /health (used for Next rewrites). */
export async function waitForLiteratureServer(
  projectRoot: string,
  timeoutMs = 3000,
): Promise<string> {
  startLiteratureServer(projectRoot);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const candidate = serverUrl || readLiteratureServerUrlFromDisk(projectRoot);
    if (candidate && (await probeHealth(candidate))) {
      serverUrl = candidate;
      return candidate;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return serverUrl || readLiteratureServerUrlFromDisk(projectRoot);
}
