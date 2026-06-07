# Literature

Dev-only copywriting for React — enter edit mode to highlight instrumented copy on the canvas, click a string to edit, and apply changes back to source files.

## What's inside

### Apps

- `web`: Next.js dogfood app

### Packages

- `@handlemotion/literature-core` — targets, recast patch, JSONL history
- `@handlemotion/literature-compiler` — Babel plugin + unplugin / Turbopack loader
- `@handlemotion/literature-client` — overlay UI, selection, `__lit` runtime marker
- `@handlemotion/literature-next` — `withLiterature()` Next.js integration
- `@handlemotion/literature-ui` — dogfood UI components (optional)

Lint/format: **oxlint** + **oxfmt** at the repo root (no ESLint).

## Install (consumer app)

```sh
pnpm add -D @handlemotion/literature-next
```

```js
// next.config.js
import { withLiterature } from "@handlemotion/literature-next";

export default withLiterature(
  {
    /* your Next config */
  },
  { projectRoot: process.cwd() }, // monorepo: pass repo root, not app dir
);
```

Patch requests are proxied at `/__literature/*` (no patch server URL in the client bundle).

```tsx
// app/literature-devtools.tsx
"use client";
import dynamic from "next/dynamic";

const LiteratureDevtools = dynamic(
  () => import("@handlemotion/literature-next/devtools").then((m) => m.LiteratureDevtools),
  { ssr: false },
);

export function LiteratureDevtoolsLoader() {
  if (process.env.NODE_ENV !== "development") return null;
  return <LiteratureDevtools />;
}

// app/layout.tsx
import { LiteratureDevtoolsLoader } from "./literature-devtools";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <LiteratureDevtoolsLoader />
      </body>
    </html>
  );
}
```

For Vite, use `createLiteraturePlugin.vite({ projectRoot })` from `@handlemotion/literature-compiler`.

## Develop

```sh
pnpm install
pnpm build
pnpm dev           # https://literature.localhost
pnpm lint          # oxlint
pnpm format:fix    # oxfmt
```

Toggle edit mode: **Alt+Shift+L** or the black pencil pill (bottom-right). In edit mode, all instrumented copy is outlined in blue — click a string to edit it in the panel, then Apply to write back to source.

## Local artifacts

Gitignored per project:

- `.literature/history.jsonl` — edit history
- `.literature/port` — patch server port

## Unsupported in v1

- Dynamic JSX expressions, i18n, non-literal props
- Do not run alongside React Grab or other DOM inspectors on the same shortcut

## Remove

1. Remove `@handlemotion/literature-next` and `LiteratureDevtools` from the app
2. Delete `.literature/` if present

## Publish

Packages ship on npm under **`@handlemotion/literature-*`** (repo: [handleui/literature](https://github.com/handleui/literature)). CI uses OIDC trusted publishing. See [docs/PUBLISHING.md](docs/PUBLISHING.md).
