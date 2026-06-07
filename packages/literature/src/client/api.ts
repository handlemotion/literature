import type { LiteratureManifest, PatchResult } from "../core/index.js";

const API_PREFIX = "/__literature";
const TOKEN_HEADER = "X-Literature-Token";

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${API_PREFIX}/health`);
  if (!res.ok) {
    throw new Error("Literature patch server unavailable");
  }

  const data = (await res.json()) as { token?: string };
  cachedToken = data.token ?? "";
  return cachedToken;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      [TOKEN_HEADER]: token,
    },
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

export async function fetchManifest(): Promise<LiteratureManifest> {
  const res = await fetch(`${API_PREFIX}/manifest`);
  if (!res.ok) {
    return { version: 1, targets: {} };
  }
  return (await res.json()) as LiteratureManifest;
}

export async function patchText(targetId: string, nextText: string): Promise<PatchResult> {
  return request<PatchResult>("POST", "/patch", { targetId, nextText });
}

export async function undoPatch(patchId?: string): Promise<PatchResult> {
  return request<PatchResult>("POST", "/undo", patchId ? { patchId } : {});
}
