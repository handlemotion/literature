# Publishing to npm

Published packages (under the **@handlemotion** scope):

- `@handlemotion/literature` — SDK (`withLiterature`, devtools, Vite plugin, `/lit` runtime)
- `@handlemotion/literature-cli` — `literature init` installer

SDK implementation lives in `packages/literature/src/{core,compiler,client,next}` and ships as a single `@handlemotion/literature` bundle.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions). No `NPM_TOKEN`.

## One-time: first release (you)

Trusted publishing only applies to **existing** packages. Publish v0.1.0 manually once per package, after building:

Bump `version` in `packages/literature/package.json` and `packages/cli/package.json` to match the git tag before pushing.

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

## Ongoing: CI publishes on tags

```sh
git tag v0.1.0
git push origin v0.1.0
```

[`.github/workflows/publish.yml`](../.github/workflows/publish.yml) builds the SDK and CLI, then publishes both via OIDC.
