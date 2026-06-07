# Literature

Dev-only copywriting for React — enter edit mode to highlight instrumented copy on the canvas, click a string to edit, and apply changes back to source files.

## Install (consumer app)

```sh
npx @handlemotion/literature-cli init -y
```

Start your dev server, then press **Alt+Shift+L** (or the pencil pill) to toggle edit mode.

### CLI options

```sh
npx @handlemotion/literature-cli init -y -f next              # Next.js override
npx @handlemotion/literature-cli init -y -f vite              # Vite override
npx @handlemotion/literature-cli init -y -p pnpm              # package manager override
npx @handlemotion/literature-cli init -y --app-dir apps/demo   # turborepo app package
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
// app/literature-devtools.tsx — see CLI output for the full file
"use client";
import dynamic from "next/dynamic";

const LiteratureDevtools = dynamic(
  () => import("@handlemotion/literature/devtools").then((m) => m.LiteratureDevtools),
  { ssr: false },
);

export function LiteratureDevtoolsLoader() {
  if (process.env.NODE_ENV !== "development") return null;
  return <LiteratureDevtools />;
}
```

Add `<LiteratureDevtoolsLoader />` inside `<body>` in `app/layout.tsx`.

For Vite, use `createLiteraturePlugin.vite({ projectRoot })` from `@handlemotion/literature/vite`.

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

## Unsupported in v1

- Dynamic JSX expressions, i18n, non-literal props
- Do not run alongside React Grab on the same shortcut
- Vite: JSX instrumentation only (no patch server in v1)

## Remove

1. Remove `@handlemotion/literature` and `LiteratureDevtools` from the app
2. Delete `.literature/` if present

## Publish

Two npm packages: `@handlemotion/literature` and `@handlemotion/literature-cli`. See [docs/PUBLISHING.md](docs/PUBLISHING.md).
