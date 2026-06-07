import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { applyPatch, readHistory, undoPatch, type LiteratureManifest } from "../../core/index.js";
import { getManifest } from "../../compiler/index.js";
import { mergeTargets, readManifestFromDisk } from "../../compiler/manifest-state.js";

export interface ServerContext {
  projectRoot: string;
  historyPath: string;
  tokenPath: string;
}

const MAX_BODY_BYTES = 1_048_576;
const MAX_PATCH_TEXT_LENGTH = 100_000;
const TOKEN_HEADER = "x-literature-token";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readToken(tokenPath: string): string {
  try {
    return readFileSync(tokenPath, "utf-8").trim();
  } catch {
    return "";
  }
}

function isAuthorized(req: IncomingMessage, ctx: ServerContext): boolean {
  const expected = readToken(ctx.tokenPath);
  if (!expected) return false;
  const provided = req.headers[TOKEN_HEADER];
  return typeof provided === "string" && provided === expected;
}

function parseHistoryLimit(raw: string | null): number {
  const parsed = Number(raw ?? "20");
  const limit = Number.isFinite(parsed) ? parsed : 20;
  return Math.min(Math.max(1, limit), 100);
}

async function parseJsonBody<T>(req: IncomingMessage, res: ServerResponse): Promise<T | null> {
  try {
    const raw = await readBody(req);
    if (!raw) {
      return {} as T;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    sendJson(res, 400, { ok: false, message });
    return null;
  }
}

function resolveManifest(projectRoot: string): LiteratureManifest {
  const inMemory = getManifest();
  if (Object.keys(inMemory.targets).length > 0) {
    return inMemory;
  }
  return readManifestFromDisk(projectRoot) ?? inMemory;
}

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: ServerContext,
): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "development") {
      sendJson(res, 403, { ok: false, message: "Literature server is dev-only" });
      return;
    }

    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const method = req.method ?? "GET";

    if (method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true, version: "0.0.0", token: readToken(ctx.tokenPath) });
      return;
    }

    if (method === "GET" && url.pathname === "/manifest") {
      sendJson(res, 200, resolveManifest(ctx.projectRoot));
      return;
    }

    if (method === "POST" && url.pathname === "/manifest/register") {
      const body = await parseJsonBody<{ targets?: LiteratureManifest["targets"] }>(req, res);
      if (!body) {
        return;
      }
      if (body.targets) {
        mergeTargets(body.targets);
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (!isAuthorized(req, ctx)) {
      sendJson(res, 403, { ok: false, message: "Unauthorized" });
      return;
    }

    if (method === "GET" && url.pathname === "/history") {
      const limit = parseHistoryLimit(url.searchParams.get("limit"));
      sendJson(res, 200, { entries: readHistory(ctx.historyPath, limit) });
      return;
    }

    if (method === "POST" && url.pathname === "/patch") {
      const body = await parseJsonBody<{ targetId?: string; nextText?: string }>(req, res);
      if (!body) {
        return;
      }
      if (!body.targetId || body.nextText === undefined) {
        sendJson(res, 400, { ok: false, message: "targetId and nextText required" });
        return;
      }
      if (body.nextText.length > MAX_PATCH_TEXT_LENGTH) {
        sendJson(res, 400, { ok: false, message: "nextText exceeds maximum length" });
        return;
      }
      const result = applyPatch({
        projectRoot: ctx.projectRoot,
        manifest: resolveManifest(ctx.projectRoot),
        targetId: body.targetId,
        nextText: body.nextText,
        historyPath: ctx.historyPath,
      });
      sendJson(res, result.ok ? 200 : 400, result);
      return;
    }

    if (method === "POST" && url.pathname === "/undo") {
      const body = await parseJsonBody<{ patchId?: string }>(req, res);
      if (!body) {
        return;
      }
      const result = undoPatch({
        projectRoot: ctx.projectRoot,
        historyPath: ctx.historyPath,
        patchId: body.patchId,
      });
      sendJson(res, result.ok ? 200 : 400, result);
      return;
    }

    sendJson(res, 404, { ok: false, message: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    sendJson(res, 500, { ok: false, message });
  }
}

export function literaturePaths(projectRoot: string) {
  const literatureDir = path.join(projectRoot, ".literature");
  return {
    historyPath: path.join(literatureDir, "history.jsonl"),
    portFile: path.join(literatureDir, "port"),
    tokenFile: path.join(literatureDir, "token"),
  };
}
