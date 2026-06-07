import assert from "node:assert/strict";
import { mkdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { resolveWithinRoot } from "./paths.js";

describe("resolveWithinRoot", () => {
  it("resolves paths inside root", async () => {
    const root = await mkdtemp(join(tmpdir(), "lit-path-"));
    const apps = join(root, "apps", "demo");
    mkdirSync(apps, { recursive: true });
    assert.equal(resolveWithinRoot(root, "apps/demo"), realpathSync.native(apps));
    rmSync(root, { recursive: true });
  });

  it("rejects traversal outside root", () => {
    assert.throws(
      () => resolveWithinRoot("/tmp/project", "../outside"),
      /must stay within/,
    );
  });

  it("rejects symlink escape", async () => {
    const root = await mkdtemp(join(tmpdir(), "lit-symlink-"));
    const outside = await mkdtemp(join(tmpdir(), "lit-outside-"));
    const link = join(root, "escape");
    symlinkSync(outside, link, "dir");
    assert.throws(() => resolveWithinRoot(root, "escape"), /must stay within/);
    rmSync(root, { recursive: true });
    rmSync(outside, { recursive: true });
  });
});
