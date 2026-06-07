import type { PatchResult } from "../core/index.js";

const API_PREFIX = "/__literature";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : res.statusText;
    throw new Error(message || "Request failed");
  }

  return data as T;
}

export async function patchText(targetId: string, nextText: string): Promise<PatchResult> {
  return request<PatchResult>("POST", "/patch", { targetId, nextText });
}

export async function undoPatch(patchId?: string): Promise<PatchResult> {
  return request<PatchResult>("POST", "/undo", patchId ? { patchId } : {});
}
