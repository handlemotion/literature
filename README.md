# Literature

Dev-only copywriting for React — enter edit mode to highlight instrumented copy on the canvas, click a string to edit, and apply changes back to source files.

## Install (consumer app)

```sh
npx @handlemotion/literature-cli init -y
```

In a turborepo, run from the repo root — the CLI auto-detects apps under `apps/*` and `packages/*`. Start your dev server, then press **Alt+Shift+L** (or the pencil pill) to toggle edit mode.

### CLI options

```sh
npx @handlemotion/literature-cli init -y -f next              # Next.js override
npx @handlemotion/literature-cli init -y -f vite               # Vite override
npx @handlemotion/literature-cli init -y -p pnpm              # package manager override
npx @handlemotion/literature-cli init -y --app-dir apps/demo   # pick a specific app
npx @handlemotion/literature-cli init --dry-run                # preview changes only
```

## Manual install (Next.js)

```sh
pnpm add -D @handlemotion/literature
```

```js
// next.config.js
import { withLiterature } from "@handlemotion/literature";

export default withLiterature(
  { /* your Next config */ },
  { projectRoot: process.cwd() },
);
```

```tsx
// app/layout.tsx
import { Literature } from "@handlemotion/literature/devtools";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Literature />
      </body>
    </html>
  );
}
```

For Vite, use `createLiteraturePlugin.vite({ projectRoot })` from `@handlemotion/literature/vite`.

Types for integrators: `@handlemotion/literature/types`.

Compiler-injected copy wrappers use `__lit` from `@handlemotion/literature/lit` (do not import manually).

## What's inside (monorepo)

- `apps/demo` — Next.js dogfood app
- `packages/literature` — published SDK (`@handlemotion/literature`; sources in `src/{core,compiler,client,next}`)
- `packages/cli` — published CLI (`@handlemotion/literature-cli`)

Lint/format: **oxlint** + **oxfmt** — `pnpm lint` / `pnpm format` from the repo root; `apps/demo` also has its own scripts and config.

## Develop

```sh
pnpm install
pnpm turbo build --filter=demo...
pnpm dev           # https://literature.localhost
pnpm lint
pnpm format:fix
```

## Local artifacts

Gitignored per project:

- `.literature/history.jsonl` — edit history
- `.literature/port` — patch server port
- `.literature/token` — dev-only patch API token

## Unsupported in v1

- Dynamic JSX expressions, i18n, non-literal props
- Do not run alongside React Grab on the same shortcut
- Vite: JSX instrumentation only (no patch server in v1)

## Remove

1. Remove `@handlemotion/literature` and `<Literature />` from the app
2. Delete `.literature/` if present

## Publish

Two npm packages: `@handlemotion/literature` and `@handlemotion/literature-cli`. See [docs/PUBLISHING.md](docs/PUBLISHING.md).
