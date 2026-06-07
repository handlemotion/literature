import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const cli = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const nextFixture = fileURLToPath(new URL("../../fixtures/next-minimal/", import.meta.url));

function runCli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return {
    status: result.status,
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  };
}

describe("literature init CLI", () => {
  it("dry-run previews without side effects", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-cli-"));
    await cp(nextFixture, dir, { recursive: true });
    const layoutPath = join(dir, "app/layout.tsx");
    const before = await readFile(layoutPath, "utf-8");

    const result = runCli(["init", "--dry-run", "-c", dir]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Would install in .+:/);
    assert.match(result.stdout, /Would update:/);
    assert.match(result.stdout, /Dry run — no changes made\./);
    assert.equal(await readFile(layoutPath, "utf-8"), before);
    await rm(dir, { recursive: true });
  });

  it("dry-run with skip-install omits install preview", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lit-cli-"));
    await cp(nextFixture, dir, { recursive: true });

    const result = runCli(["init", "--dry-run", "--skip-install", "-c", dir]);

    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /Would install:/);
    assert.match(result.stdout, /Would update:/);
    await rm(dir, { recursive: true });
  });
});
