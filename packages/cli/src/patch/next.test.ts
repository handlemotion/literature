import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { patchNextProject } from "./next.js";

const nextFixture = fileURLToPath(new URL("../../fixtures/next-minimal/", import.meta.url));
const configuredFixture = fileURLToPath(
  new URL("../../fixtures/next-configured/", import.meta.url),
);

const nextInfo = (appDir: string) => ({
  framework: "next" as const,
  appDir,
});

describe("patchNextProject dry-run", () => {
  it("returns planned files without writing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-"));
    await cp(nextFixture, dir, { recursive: true });
    const layoutPath = join(dir, "app/layout.tsx");
    const before = await readFile(layoutPath, "utf-8");

    const { files } = patchNextProject(dir, nextInfo(dir), { force: false, dryRun: true });

    assert.ok(files.length > 0);
    assert.ok(files.some((file) => file.endsWith("app/layout.tsx")));
    assert.ok(!files.some((file) => file.endsWith("literature-devtools.tsx")));
    const after = await readFile(layoutPath, "utf-8");
    assert.equal(after, before);
    await rm(dir, { recursive: true });
  });

  it("patches layout with Literature import", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-"));
    await cp(nextFixture, dir, { recursive: true });
    const layoutPath = join(dir, "app/layout.tsx");

    patchNextProject(dir, nextInfo(dir), { force: false, dryRun: false });

    const layout = await readFile(layoutPath, "utf-8");
    assert.match(layout, /import \{ Literature \} from "@handlemotion\/literature\/devtools"/);
    assert.match(layout, /<Literature \/>/);
    await rm(dir, { recursive: true });
  });

  it("patches next.config with projectRoot: process.cwd() only", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-config-"));
    await cp(nextFixture, dir, { recursive: true });

    patchNextProject(dir, nextInfo(dir), { force: false, dryRun: false });

    const config = await readFile(join(dir, "next.config.ts"), "utf-8");
    assert.match(config, /projectRoot: process\.cwd\(\)/);
    assert.doesNotMatch(config, /turbopack/);
    assert.doesNotMatch(config, /path\.resolve\(__dirname/);
    await rm(dir, { recursive: true });
  });

  it("creates next.config at package root for src/app layout", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-src-"));
    await mkdir(join(dir, "src", "app"), { recursive: true });
    await writeFile(join(dir, "src", "app", "layout.tsx"), "export default function Layout() {}\n");
    await writeFile(join(dir, "next.config.ts"), "export default {};\n");

    const { files } = patchNextProject(dir, nextInfo(join(dir, "src")), {
      force: false,
      dryRun: false,
    });

    assert.ok(files.some((file) => file.endsWith("next.config.ts")));
    assert.ok(!files.some((file) => file.includes(`${join("src", "next.config.ts")}`)));
    await rm(dir, { recursive: true });
  });

  it("returns no files when already configured", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-configured-"));
    await cp(configuredFixture, dir, { recursive: true });

    const { files } = patchNextProject(dir, nextInfo(dir), { force: false, dryRun: true });

    assert.equal(files.length, 0);
    await rm(dir, { recursive: true });
  });

  it("force previews wrapped next.config in dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-force-"));
    await cp(configuredFixture, dir, { recursive: true });
    const configPath = join(dir, "next.config.ts");
    const before = await readFile(configPath, "utf-8");

    const { files } = patchNextProject(dir, nextInfo(dir), { force: true, dryRun: true });

    assert.ok(files.includes(configPath));
    assert.equal(await readFile(configPath, "utf-8"), before);
    await rm(dir, { recursive: true });
  });
});
