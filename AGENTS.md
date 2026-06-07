# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Literature is a **pnpm + Turborepo monorepo** for dev-only React copywriting. The only runnable app is `apps/web` (Next.js 16 dogfood). There is no database, Docker, or external services. In dev, `withLiterature()` starts an embedded patch server proxied at `/__literature/*`.

See [README.md](README.md) for standard install/build/dev commands.

### Services

| Service | Command | URL |
|---------|---------|-----|
| Next.js dev (dogfood app) | `pnpm --filter web dev:app` | http://localhost:3000 |
| Next.js dev (portless hostname) | `pnpm dev` from repo root | https://literature.localhost |
| Literature patch server | Auto-started in dev | http://localhost:3000/__literature/health |

### First-time / after clone

Library packages are consumed from `dist/`. Turbo `dev` depends on `^build`, so run a build before the first dev session:

```sh
pnpm install
pnpm turbo build --filter=web...
```

**Note:** Root `pnpm build` fails on `@handleui/literature-vite` (stub package with no source). Use the filtered build above or match CI:

```sh
pnpm turbo build \
  --filter=@handleui/literature-core \
  --filter=@handleui/literature-compiler \
  --filter=@handleui/literature-client \
  --filter=@handleui/literature-next
```

### Cloud VM / localhost dev

When not using portless, run `pnpm --filter web dev:app` on port 3000. If Literature devtools fail to connect from `localhost`, add `"localhost"` to `allowedDevOrigins` in `apps/web/next.config.js`.

### Lint / types / tests

- **Lint:** `pnpm lint` (oxlint). Known issue: unused `setVisible` in `packages/client/src/LiteratureRoot.tsx`.
- **Types:** `pnpm check-types` fails on `@handleui/literature-vite` stub (no `tsconfig.json`). Use `pnpm turbo check-types --filter=web...` for the app stack.
- **Tests:** No automated test suite in this repo; verify manually via the dogfood app in dev mode (Alt+Shift+L toggles edit mode).

### Local artifacts (gitignored)

- `.literature/history.jsonl` — edit history
- `.literature/port` — patch server port
