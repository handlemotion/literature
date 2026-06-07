import assert from "node:assert/strict";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { resolvePathUnderRoot } from "./paths.js";

describe("resolvePathUnderRoot", () => {
  it("rejects symlink escape", () => {
    const root = mkdtempSync(join(tmpdir(), "lit-paths-"));
    const outside = mkdtempSync(join(tmpdir(), "lit-outside-"));
    try {
      symlinkSync(outside, join(root, "escape"), "dir");
      assert.equal(resolvePathUnderRoot(root, "escape"), null);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
