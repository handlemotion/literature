export type TextTargetKind = "jsxText" | "stringProp";

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface TextTarget {
  id: string;
  kind: TextTargetKind;
  filePath: string;
  range: SourceRange;
  literal: string;
  literalHash: string;
  propName?: string;
  hostHint?: string;
}

export interface LiteratureManifest {
  version: 1;
  targets: Record<string, TextTarget>;
}

export interface HistoryEntry {
  id: string;
  ts: string;
  targetId: string;
  filePath: string;
  kind: TextTargetKind;
  range: SourceRange;
  before: string;
  after: string;
  inverse: { range: SourceRange; text: string };
}

export type PatchErrorCode =
  | "TARGET_NOT_FOUND"
  | "LITERAL_MISMATCH"
  | "AMBIGUOUS_MATCH"
  | "UNSUPPORTED_NODE"
  | "FILE_BUSY"
  | "FILE_NOT_FOUND";

export interface PatchSuccess {
  ok: true;
  patchId: string;
  filePath: string;
  target: TextTarget;
}

export interface PatchFailure {
  ok: false;
  code: PatchErrorCode;
  message: string;
  details?: unknown;
}

export type PatchResult = PatchSuccess | PatchFailure;
