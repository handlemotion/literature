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

Published packages: `@handlemotion/literature` (SDK) and `@handlemotion/literature-cli` (`literature init`). SDK sources live under `packages/literature/src/{core,compiler,client,next}`. Build with `pnpm turbo build --filter=demo...`.

### Cloud VM / localhost dev

When not using portless, run `pnpm --filter demo dev:app` on port 3000. If Literature devtools fail to connect from `localhost`, add `"localhost"` to `allowedDevOrigins` in `apps/demo/next.config.js`.

### Lint / types / tests

- **Lint:** `pnpm lint` (oxlint + oxfmt; packages at repo root, demo via `apps/demo`).
- **Types:** `pnpm turbo check-types --filter=demo...` for the app stack.
- **Tests:** No automated test suite in this repo; verify manually via the dogfood app in dev mode (Alt+Shift+L toggles edit mode).

### Local artifacts (gitignored)

- `.literature/history.jsonl` — edit history
- `.literature/port` — patch server port
