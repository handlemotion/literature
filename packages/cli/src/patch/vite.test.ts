import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { patchViteProject } from "./vite.js";

const viteFixture = fileURLToPath(new URL("../../fixtures/vite-minimal/", import.meta.url));
const viteAppDirFixture = fileURLToPath(
  new URL("../../fixtures/vite-app-dir/apps/web/", import.meta.url),
);

describe("patchViteProject dry-run", () => {
  it("returns planned files without writing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-vite-"));
    await cp(viteFixture, dir, { recursive: true });
    const configPath = join(dir, "vite.config.ts");
    const before = await readFile(configPath, "utf-8");

    const { files } = patchViteProject(dir, { force: false, dryRun: true });

    assert.equal(files.length, 1);
    assert.equal(files[0], configPath);
    const after = await readFile(configPath, "utf-8");
    assert.equal(after, before);
    await rm(dir, { recursive: true });
  });

  it("patches vite.config inside app directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-vite-app-"));
    await cp(viteAppDirFixture, dir, { recursive: true });
    const configPath = join(dir, "vite.config.ts");

    const { files } = patchViteProject(dir, { force: false, dryRun: true });

    assert.deepEqual(files, [configPath]);
    await rm(dir, { recursive: true });
  });

  it("returns no files when plugin already configured", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-vite-configured-"));
    await cp(viteFixture, dir, { recursive: true });
    const configPath = join(dir, "vite.config.ts");
    const content = await readFile(configPath, "utf-8");
    await writeFile(
      configPath,
      content.replace(
        "plugins: []",
        "plugins: [createLiteraturePlugin.vite({ projectRoot: process.cwd() })]",
      ),
    );

    const { files } = patchViteProject(dir, { force: false, dryRun: true });

    assert.equal(files.length, 0);
    await rm(dir, { recursive: true });
  });
});
