# AGENTS.md

Instructions for Cursor Cloud and coding agents working in this monorepo.

**Install, manual setup, and dev commands:** [README.md](README.md)

## Overview

Dev-only React copywriting. Runnable app: `apps/demo` (Next.js 16). No database, Docker, or external services. In dev, `withLiterature()` embeds a patch server proxied at `/__literature/*`.

SDK sources: `packages/literature/src/{core,compiler,client,next}`. Mount devtools with `<Literature />` from `@handlemotion/literature/devtools`.

## Services

| Service | Command | URL |
|---------|---------|-----|
| Next.js dev (dogfood) | `pnpm --filter demo dev:app` | http://localhost:3000 |
| Next.js dev (portless) | `pnpm dev` from repo root | https://literature.localhost |
| Patch server | Auto-started in dev | `…/__literature/health` on the app origin |

Without portless, use `pnpm --filter demo dev:app`. The demo config allows `*.localhost` origins (including `literature.localhost` via portless).

## Verify changes

- **Types:** `pnpm turbo check-types --filter=demo...`
- **Tests:** `pnpm test` (CLI `node:test` via Turbo)
- **UI:** No app-level automated tests — dogfood in dev mode (**Alt+Shift+L** toggles edit mode)
- **`literature init`:** Run from `apps/demo` (or `-c apps/demo`), not the repo root — root lists apps and exits

## Releasing

Published: `@handlemotion/literature` (SDK) and `@handlemotion/literature-cli` (`literature init`). CI publishes via [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no `NPM_TOKEN`).

**One-time npm setup:** [docs/PUBLISHING.md](docs/PUBLISHING.md)

**Never** run `pnpm release`, `pnpm publish`, or `changeset publish` unless explicitly asked to debug CI.

### When you need a changeset

| Touched | Changeset? |
|---------|------------|
| `packages/literature` or `packages/cli` (user-visible) | Yes — `pnpm changeset` |
| `apps/demo`, docs, tests, CI, refactors with no release impact | `pnpm changeset --empty` |
| Unsure | Would someone upgrading from npm care? If yes, changeset. |

### Writing the summary

The summary becomes the public changelog. Write for **people using Literature in their app**, not repo maintainers.

- **Lead with the outcome** — what works differently after they upgrade.
- **Plain language** — no file paths, PR numbers, or internal module names.
- **Keep it short** — one sentence is fine; a second line only for a distinct second change.
- **Match semver honestly:**
  - **patch** — bug fix, small behavior fix, no API change
  - **minor** — new capability, backwards-compatible API addition
  - **major** — breaking change (rename/remove option, required new setup step, etc.)

Good:

> Fix `literature init` on repos that already use `withLiterature`.
>
> Add Vite support to `literature init` for apps without a root layout.

Bad:

> Refactor `packages/cli/src/patch/vite.ts` to use shared types.
>
> Update publish workflow and bump deps.

Pick `@handlemotion/literature`, `@handlemotion/literature-cli`, or **both** when the user-visible change spans SDK and installer.

### PR flow

1. **Your PR** — include a `.changeset/*.md` file (`pnpm changeset` or `--empty`), same PR as the code.
2. **Merge to `main`** — if unreleased changesets exist, [`publish.yml`](.github/workflows/publish.yml) opens a **Version Packages** PR.
3. **Merge Version Packages** — CI builds and publishes both packages via OIDC.
