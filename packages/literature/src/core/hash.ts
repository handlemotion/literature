import { createHash } from "node:crypto";

export function normalizeLiteral(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function literalHash(text: string): string {
  return createHash("sha256").update(normalizeLiteral(text)).digest("hex");
}

export function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
