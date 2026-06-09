# Literature

Dev-only copywriting for React. Toggle edit mode, click instrumented copy on the canvas, edit in the panel, and **Apply** writes back to source.

## Quick start

```sh
cd your-app   # or apps/your-app / packages/your-app in a monorepo
npx @handlemotion/literature-cli init -y
```

Run `literature init` from your app directory (where `next.config` or `vite.config` lives). From a monorepo root, the CLI lists compatible apps under `apps/*` and `packages/*` and exits.

Start your dev server, then **Alt+Shift+L** (or the pencil pill) to edit copy on the canvas.

## Manual setup

### Next.js

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

If Next.js 16 Turbopack fails to resolve packages in a monorepo, set `turbopack: { root: … }` in your own `next.config` per the [Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack) — Literature does not inject this.

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

### Vite

Use `createLiteraturePlugin.vite({ projectRoot })` from `@handlemotion/literature/vite`.

## Develop (this repo)

```sh
pnpm install
pnpm turbo build --filter=demo...
pnpm dev
```

## Limits

- Dynamic JSX, i18n, non-literal props — not supported in v1
- Don't share **Alt+Shift+L** with React Grab or other DOM inspectors
- Vite: instrumentation only (no patch server in v1)

## Uninstall

Remove `@handlemotion/literature`, `<Literature />`, and `.literature/` if present.

## Maintainers

- [AGENTS.md](AGENTS.md) — agent conventions and changeset writing
- [docs/PUBLISHING.md](docs/PUBLISHING.md) — npm trusted publishing
