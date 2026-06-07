import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { isUnderDir, normalizeResourcePath } from "./paths.js";

describe("compiler paths", () => {
  const projectRoot = "/repo";
  const appRoot = path.join(projectRoot, "apps/demo");

  it("normalizes turbopack [project]/ paths", () => {
    const normalized = normalizeResourcePath("[project]/apps/demo/app/page.tsx", projectRoot);
    assert.equal(normalized, path.join(projectRoot, "apps/demo/app/page.tsx"));
  });

  it("treats normalized turbopack paths as under appRoot", () => {
    const normalized = normalizeResourcePath("[project]/apps/demo/app/page.tsx", projectRoot);
    assert.equal(isUnderDir(normalized, appRoot), true);
  });

  it("rejects paths outside appRoot", () => {
    const normalized = normalizeResourcePath("[project]/packages/literature/src/foo.tsx", projectRoot);
    assert.equal(isUnderDir(normalized, appRoot), false);
  });
});
