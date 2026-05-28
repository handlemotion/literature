# Publishing to npm

Published packages (under the **@handleui** scope):

- `@handleui/literature-core`
- `@handleui/literature-compiler`
- `@handleui/literature-client`
- `@handleui/literature-next` — primary install target

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions). No `NPM_TOKEN`, no provenance (`publishConfig.provenance: false` and root `.npmrc`).

## One-time: first release (you)

Trusted publishing only applies to **existing** packages. Publish v0 manually once per package (dependency order), after versions in `package.json` match your tag:

```sh
pnpm install
pnpm turbo build \
  --filter=@handleui/literature-core \
  --filter=@handleui/literature-compiler \
  --filter=@handleui/literature-client \
  --filter=@handleui/literature-next

pnpm publish -r \
  --filter '@handleui/literature-core' \
  --filter '@handleui/literature-compiler' \
  --filter '@handleui/literature-client' \
  --filter '@handleui/literature-next' \
  --access public \
  --no-git-checks
```

Or from each package directory: `npm publish --access public` (npm 11.5.1+).

## One-time: register trusted publishers (you)

For **each** package on [npmjs.com](https://www.npmjs.com):

1. Package → **Settings** → **Publishing access** → **Trusted Publisher** → **GitHub Actions**
2. **Organization or user:** `handleui`
3. **Repository:** `literature`
4. **Workflow filename:** `publish.yml`
5. **Environment:** leave empty unless you add a GitHub Environment later

## Ongoing: CI publishes on tags

```sh
git tag v0.1.0
git push origin v0.1.0
```

[`.github/workflows/publish.yml`](../.github/workflows/publish.yml) builds and publishes via OIDC.
