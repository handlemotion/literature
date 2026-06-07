import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { discoverApps, resolveAppTarget } from "./apps.js";

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function scaffoldMonorepo(root: string): void {
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n", "utf-8");
  writeFileSync(join(root, "turbo.json"), "{}\n", "utf-8");
  writeJson(join(root, "package.json"), { name: "root", private: true });

  const demoDir = join(root, "apps", "demo");
  mkdirSync(join(demoDir, "app"), { recursive: true });
  writeJson(join(demoDir, "package.json"), { name: "demo", private: true });
  writeFileSync(join(demoDir, "next.config.ts"), "export default {};\n", "utf-8");
  writeFileSync(
    join(demoDir, "app", "layout.tsx"),
    "export default function RootLayout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }\n",
    "utf-8",
  );
}

describe("discoverApps", () => {
  it("finds apps under apps/*", () => {
    const root = mkdtempSync(join(tmpdir(), "lit-apps-"));
    try {
      scaffoldMonorepo(root);
      const apps = discoverApps(root);
      assert.equal(apps.length, 1);
      assert.equal(apps[0]?.relPath, "apps/demo");
      assert.equal(apps[0]?.framework, "next");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("resolveAppTarget", () => {
  it("auto-selects the only app in a monorepo", async () => {
    const root = mkdtempSync(join(tmpdir(), "lit-resolve-"));
    try {
      scaffoldMonorepo(root);
      const target = await resolveAppTarget(root, {});
      assert.equal(target.relPath, "apps/demo");
      assert.equal(target.installCwd, join(root, "apps", "demo"));
      assert.ok(existsSync(join(target.appRoot, "app")));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
