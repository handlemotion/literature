# @handlemotion/literature

## 0.3.0

### Minor Changes

- [`e24633e`](https://github.com/handlemotion/literature/commit/e24633e16b288dc302f6cb7ff6f388322eff53c6) Thanks [@handlemotion](https://github.com/handlemotion)! - `literature init` must run from an app directory. Removed `--app-dir` and monorepo auto-discovery. At monorepo root, the CLI lists compatible apps under `apps/*` and `packages/*`.

  `withLiterature` is app-local by default. Configure `turbopack.root` in your own `next.config` if Next.js requires it.

  Require auth for dev manifest registration from the compiler.

## 0.2.1

### Patch Changes

- [`94347dc`](https://github.com/handlemotion/literature/commit/94347dc0e193b38e23355171a4b43346f217f2d5) Thanks [@handlemotion](https://github.com/handlemotion)! - Fix edit mode and Apply on Next.js 16 with Turbopack, including monorepo setups.

  Fix Apply failing on `.tsx` files and Option+Shift+L on macOS keyboard layouts.

## 0.2.0

### Minor Changes

- [`0ae5f3e`](https://github.com/handlemotion/literature/commit/0ae5f3e58bd27e08748b486831eed55472458547) Thanks [@handlemotion](https://github.com/handlemotion)! - Mount devtools with `<Literature />` from `@handlemotion/literature/devtools` — no separate devtools component file.

  `literature init` auto-detects apps in monorepos, supports Vite, and adds `--dry-run` and `--app-dir`.
