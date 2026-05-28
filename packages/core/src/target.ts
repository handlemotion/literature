import { createHash } from "node:crypto";
import type { SourceRange, TextTarget, TextTargetKind } from "./types.js";
import { base64url, literalHash, normalizeLiteral } from "./hash.js";

export function createTargetId(
  filePath: string,
  kind: TextTargetKind,
  range: SourceRange,
  literal: string,
): string {
  const hash = literalHash(literal);
  const payload = [
    filePath,
    kind,
    `${range.start.line}:${range.start.column}:${range.end.line}:${range.end.column}`,
    hash,
  ].join("\0");
  const digest = base64url(createHash("sha256").update(payload).digest());
  return `lit_${digest.slice(0, 22)}`;
}

export function buildTextTarget(input: {
  kind: TextTargetKind;
  filePath: string;
  range: SourceRange;
  literal: string;
  propName?: string;
  hostHint?: string;
}): TextTarget {
  const literal = normalizeLiteral(input.literal);
  const id = createTargetId(input.filePath, input.kind, input.range, literal);
  return {
    id,
    kind: input.kind,
    filePath: input.filePath,
    range: input.range,
    literal,
    literalHash: literalHash(literal),
    propName: input.propName,
    hostHint: input.hostHint,
  };
}
