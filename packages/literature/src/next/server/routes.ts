import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { applyPatch, readHistory, undoPatch, type LiteratureManifest } from "../../core/index.js";
import { getManifest } from "../../compiler/index.js";

export interface ServerContext {
  projectRoot: string;
  historyPath: string;
}

const MAX_BODY_BYTES = 1_048_576;
const MAX_PATCH_TEXT_LENGTH = 100_000;

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

function getManifestSnapshot(): LiteratureManifest {
  return getManifest();
}

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: ServerContext,
): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    sendJson(res, 403, { ok: false, message: "Literature server is dev-only" });
    return;
  }

  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true, version: "0.0.0" });
    return;
  }

  if (method === "GET" && url.pathname === "/history") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
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
      manifest: getManifestSnapshot(),
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
}

export function literaturePaths(projectRoot: string) {
  return {
    historyPath: path.join(projectRoot, ".literature", "history.jsonl"),
    portFile: path.join(projectRoot, ".literature", "port"),
  };
}
