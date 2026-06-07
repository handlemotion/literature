import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { patchNextProject } from "./next.js";

const nextFixture = fileURLToPath(new URL("../../fixtures/next-minimal/", import.meta.url));
const configuredFixture = fileURLToPath(
  new URL("../../fixtures/next-configured/", import.meta.url),
);

describe("patchNextProject dry-run", () => {
  it("returns planned files without writing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-"));
    await cp(nextFixture, dir, { recursive: true });
    const layoutPath = join(dir, "app/layout.tsx");
    const before = await readFile(layoutPath, "utf-8");

    const { files } = patchNextProject(
      dir,
      {
        framework: "next",
        appDir: dir,
        nextRouter: "app",
        isMonorepo: false,
      },
      { force: false, dryRun: true },
    );

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

    patchNextProject(
      dir,
      {
        framework: "next",
        appDir: dir,
        nextRouter: "app",
        isMonorepo: false,
      },
      { force: false, dryRun: false },
    );

    const layout = await readFile(layoutPath, "utf-8");
    assert.match(layout, /import \{ Literature \} from "@handlemotion\/literature\/devtools"/);
    assert.match(layout, /<Literature \/>/);
    await rm(dir, { recursive: true });
  });

  it("returns no files when already configured", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-configured-"));
    await cp(configuredFixture, dir, { recursive: true });

    const { files } = patchNextProject(
      dir,
      {
        framework: "next",
        appDir: dir,
        nextRouter: "app",
        isMonorepo: false,
      },
      { appRoot: dir, force: false, dryRun: true },
    );

    assert.equal(files.length, 0);
    await rm(dir, { recursive: true });
  });

  it("force previews wrapped next.config in dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-next-force-"));
    await cp(configuredFixture, dir, { recursive: true });
    const configPath = join(dir, "next.config.ts");
    const before = await readFile(configPath, "utf-8");

    const { files } = patchNextProject(
      dir,
      {
        framework: "next",
        appDir: dir,
        nextRouter: "app",
        isMonorepo: false,
      },
      { appRoot: dir, force: true, dryRun: true },
    );

    assert.ok(files.includes(configPath));
    assert.equal(await readFile(configPath, "utf-8"), before);
    await rm(dir, { recursive: true });
  });
});
