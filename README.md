# Literature

Turborepo monorepo for [Literature](https://github.com/handleui/literature) — a dev-only copywriting tool for React apps.

## What's inside

### Apps

- `web`: Next.js app (product shell)

### Packages

- `@literature/ui`: shared React components
- `@literature/eslint-config`: ESLint configs
- `@literature/typescript-config`: shared `tsconfig` presets

## Develop

```sh
pnpm install
pnpm dev
```

Run only the web app:

```sh
pnpm exec turbo dev --filter=web
```

## Build

```sh
pnpm build
```
