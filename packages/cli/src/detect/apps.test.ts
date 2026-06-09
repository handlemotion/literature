import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { listCompatibleApps, resolveAppTarget } from "./apps.js";

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

describe("listCompatibleApps", () => {
  it("finds apps under apps/*", () => {
    const root = mkdtempSync(join(tmpdir(), "lit-apps-"));
    try {
      scaffoldMonorepo(root);
      const apps = listCompatibleApps(root);
      assert.equal(apps.length, 1);
      assert.equal(apps[0]?.relPath, "apps/demo");
      assert.equal(apps[0]?.framework, "next");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("resolveAppTarget", () => {
  it("errors at monorepo root with app list", () => {
    const root = mkdtempSync(join(tmpdir(), "lit-resolve-"));
    try {
      scaffoldMonorepo(root);
      assert.throws(
        () => resolveAppTarget(root, {}),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match(err.message, /Run from an app directory/);
          assert.match(err.message, /apps\/demo/);
          assert.match(err.message, /cd apps\/demo/);
          return true;
        },
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("errors at monorepo root even when root has a next config", () => {
    const root = mkdtempSync(join(tmpdir(), "lit-resolve-root-config-"));
    try {
      scaffoldMonorepo(root);
      writeFileSync(join(root, "next.config.ts"), "export default {};\n", "utf-8");
      assert.throws(() => resolveAppTarget(root, {}), /Run from an app directory/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("resolves when cwd is the app package", () => {
    const root = mkdtempSync(join(tmpdir(), "lit-resolve-app-"));
    try {
      scaffoldMonorepo(root);
      const appDir = join(root, "apps", "demo");
      const target = resolveAppTarget(appDir, {});
      assert.equal(target.installCwd, appDir);
      assert.ok(existsSync(join(target.frameworkInfo.appDir, "app")));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
