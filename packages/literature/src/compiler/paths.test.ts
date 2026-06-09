import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { isUnderDir, normalizeResourcePath, resolveAppRoot } from "./paths.js";

describe("compiler paths", () => {
  const projectRoot = "/app";
  const appRoot = path.join(projectRoot, "src");

  it("normalizes turbopack [project]/ paths", () => {
    const normalized = normalizeResourcePath("[project]/app/page.tsx", projectRoot);
    assert.equal(normalized, path.join(projectRoot, "app/page.tsx"));
  });

  it("treats normalized turbopack paths as under appRoot", () => {
    const normalized = normalizeResourcePath("[project]/src/app/page.tsx", projectRoot);
    assert.equal(isUnderDir(normalized, appRoot), true);
  });

  it("rejects paths outside appRoot", () => {
    const normalized = normalizeResourcePath("[project]/packages/foo.tsx", projectRoot);
    assert.equal(isUnderDir(normalized, appRoot), false);
  });

  it("resolves src/app package root", () => {
    const root = mkdtempSync(path.join(tmpdir(), "lit-app-root-"));
    try {
      mkdirSync(path.join(root, "src", "app"), { recursive: true });
      assert.equal(resolveAppRoot(root), path.join(root, "src"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects symlink escape from appRoot", () => {
    const root = mkdtempSync(path.join(tmpdir(), "lit-symlink-"));
    const outside = mkdtempSync(path.join(tmpdir(), "lit-outside-"));
    try {
      const appDir = path.join(root, "src", "app");
      mkdirSync(appDir, { recursive: true });
      const outsideFile = path.join(outside, "secret.tsx");
      writeFileSync(outsideFile, "export {};\n");
      const linkPath = path.join(appDir, "linked.tsx");
      symlinkSync(outsideFile, linkPath);
      assert.equal(isUnderDir(realpathSync.native(linkPath), path.join(root, "src")), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
