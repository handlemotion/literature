# Publishing to npm

Published packages (under the **@handlemotion** scope):

- `@handlemotion/literature` — SDK (`withLiterature`, devtools, Vite plugin, `/lit` runtime)
- `@handlemotion/literature-cli` — `literature init` installer

SDK implementation lives in `packages/literature/src/{core,compiler,client,next}` and ships as multiple ESM entry points (`index`, `devtools` + client chunks, `vite`, `lit`, `types`, `literature-loader.cjs`).

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions). No `NPM_TOKEN`.

## One-time: first release (you)

Trusted publishing only applies to **existing** packages. Publish v0.1.0 manually once per package, after building:

```sh
pnpm install
pnpm turbo build \
  --filter=@handlemotion/literature... \
  --filter=@handlemotion/literature-cli

pnpm publish -r \
  --filter '@handlemotion/literature' \
  --filter '@handlemotion/literature-cli' \
  --access public \
  --no-git-checks
```

Or from each package directory: `npm publish --access public` (npm 11.5.1+).

## One-time: register trusted publishers (you)

For **each** package on [npmjs.com](https://www.npmjs.com):

1. Package → **Settings** → **Publishing access** → **Trusted Publisher** → **GitHub Actions**
2. **Organization or user:** `handlemotion`
3. **Repository:** `literature`
4. **Workflow filename:** `publish.yml`
5. **Environment:** leave empty unless you add a GitHub Environment later

## Ongoing: Changesets + CI

1. After a change, add a changeset:

   ```sh
   pnpm changeset
   ```

   Pick `@handlemotion/literature`, `@handlemotion/literature-cli`, or both, and write a short summary.

2. Merge the changeset with your PR to `main`.

3. [`.github/workflows/publish.yml`](../.github/workflows/publish.yml) opens a **Version Packages** PR that bumps versions and updates changelogs. Merge that PR to publish both packages to npm via OIDC.

Do not version or publish locally in normal workflow — OIDC only runs in GitHub Actions. Contributor guide: [AGENTS.md](../AGENTS.md#releasing-changesets--oidc).
