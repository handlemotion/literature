# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Literature is a **pnpm + Turborepo monorepo** for dev-only React copywriting. The only runnable app is `apps/demo` (Next.js 16 dogfood). There is no database, Docker, or external services. In dev, `withLiterature()` starts an embedded patch server proxied at `/__literature/*`.

See [README.md](README.md) for standard install/build/dev commands.

### Services

| Service | Command | URL |
|---------|---------|-----|
| Next.js dev (dogfood app) | `pnpm --filter demo dev:app` | http://localhost:3000 |
| Next.js dev (portless hostname) | `pnpm dev` from repo root | https://literature.localhost |
| Literature patch server | Auto-started in dev | http://localhost:3000/__literature/health |

### First-time / after clone

Library packages are consumed from `dist/`. Turbo `dev` depends on `^build`, so run a build before the first dev session:

```sh
pnpm install
pnpm turbo build --filter=demo...
```

Published packages: `@handlemotion/literature` (SDK) and `@handlemotion/literature-cli` (`literature init`). SDK sources live under `packages/literature/src/{core,compiler,client,next}`. Mount devtools with `<Literature />` from `@handlemotion/literature/devtools` in the root layout. Build with `pnpm turbo build --filter=demo...`.

### Cloud VM / localhost dev

When not using portless, run `pnpm --filter demo dev:app` on port 3000. The demo config sets `allowedDevOrigins` for `*.localhost` (including `literature.localhost` via portless).

### Lint / types / tests

- **Lint:** `pnpm lint` (oxlint + oxfmt; packages at repo root, demo via `apps/demo`).
- **Types:** `pnpm turbo check-types --filter=demo...` for the app stack.
- **Tests:** `pnpm test` (CLI `node:test` via Turbo). No app-level automated tests; verify SDK/UI manually via the dogfood app in dev mode (Alt+Shift+L toggles edit mode).

### Local artifacts (gitignored)

- `.literature/history.jsonl` — edit history
- `.literature/port` — patch server port
- `.literature/token` — dev-only patch API token

### Releasing (Changesets + OIDC)

Published packages: `@handlemotion/literature` (SDK) and `@handlemotion/literature-cli` (`literature init`). **Do not publish manually** — CI publishes via [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no `NPM_TOKEN`). See [docs/PUBLISHING.md](docs/PUBLISHING.md) for one-time npm setup only.

#### When you need a changeset

| Touched | Changeset? |
|---------|------------|
| `packages/literature` or `packages/cli` (user-visible) | Yes — `pnpm changeset` |
| `apps/demo`, docs, tests, CI, refactors with no release impact | `pnpm changeset --empty` |
| Unsure | Ask: would someone upgrading from npm care? If yes, changeset. |

#### Writing the summary

The summary becomes the public changelog. Write for **people using Literature in their app**, not for repo maintainers.

- **Lead with the outcome** — what works differently after they upgrade.
- **Use plain language** — no file paths, PR numbers, or internal module names.
- **Keep it short** — one sentence is fine; use a second line only for a distinct second user-facing change.
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

#### PR flow

1. **Your PR** — include a `.changeset/*.md` file (from `pnpm changeset` or `--empty`). Same PR as the code change.
2. **Merge to `main`** — if unreleased changesets exist, [`publish.yml`](.github/workflows/publish.yml) opens a **Version Packages** PR (version bumps + `CHANGELOG.md` updates).
3. **Merge Version Packages** — CI builds and publishes to npm via OIDC. Done.

Agents: never run `pnpm release`, `pnpm publish`, or `changeset publish` unless explicitly asked to debug CI. Versioning and publish are CI-only.
