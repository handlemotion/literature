import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { HistoryEntry } from "../types.js";

export function ensureHistoryDir(historyPath: string): void {
  const dir = path.dirname(historyPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function appendHistory(historyPath: string, entry: HistoryEntry): void {
  ensureHistoryDir(historyPath);
  appendFileSync(historyPath, `${JSON.stringify(entry)}\n`, "utf-8");
}

function parseHistoryLine(line: string): HistoryEntry | null {
  try {
    return JSON.parse(line) as HistoryEntry;
  } catch {
    return null;
  }
}

export function readHistory(historyPath: string, limit = 20): HistoryEntry[] {
  if (!existsSync(historyPath)) return [];
  const lines = readFileSync(historyPath, "utf-8").trim().split("\n").filter(Boolean);
  const entries = lines.flatMap((line) => {
    const entry = parseHistoryLine(line);
    return entry ? [entry] : [];
  });
  return entries.slice(-limit).reverse();
}

export function getLatestEntry(historyPath: string): HistoryEntry | null {
  const entries = readHistory(historyPath, 1);
  return entries[0] ?? null;
}
