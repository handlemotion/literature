---
"@handlemotion/literature-cli": major
"@handlemotion/literature": minor
---

`literature init` must run from an app directory. Removed `--app-dir` and monorepo auto-discovery. At monorepo root, the CLI lists compatible apps under `apps/*` and `packages/*`.

`withLiterature` is app-local by default. Configure `turbopack.root` in your own `next.config` if Next.js requires it.

Require auth for dev manifest registration from the compiler.
