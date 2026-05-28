export type {
  HistoryEntry,
  LiteratureManifest,
  PatchFailure,
  PatchResult,
  PatchSuccess,
  SourceRange,
  TextTarget,
  TextTargetKind,
} from "./types.js";
export { normalizeLiteral, literalHash } from "./hash.js";
export { buildTextTarget, createTargetId } from "./target.js";
export { resolvePathUnderRoot } from "./paths.js";
export { applyPatch } from "./patch.js";
export { readHistory, appendHistory, getLatestEntry } from "./history/store.js";
export { undoPatch } from "./history/undo.js";
