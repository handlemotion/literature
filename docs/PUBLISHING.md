# Publishing to npm

Two packages under **@handlemotion**:

| Package | Contents |
|---------|----------|
| `@handlemotion/literature` | SDK — `withLiterature`, devtools, Vite plugin, `/lit` runtime |
| `@handlemotion/literature-cli` | `literature init` installer |

Publishing is **CI-only** via [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions). No `NPM_TOKEN`.

## Day-to-day workflow

1. Add a changeset after user-visible package changes:

   ```sh
   pnpm changeset
   ```

   Writing guidelines: [AGENTS.md § Releasing](../AGENTS.md#releasing).

2. Merge the changeset with your PR to `main`.

3. [`publish.yml`](../.github/workflows/publish.yml) opens a **Version Packages** PR (version bumps + changelogs). Merge it to publish both packages.

Do not version or publish locally in normal workflow.

## One-time: trusted publishers

For **each** package on [npmjs.com](https://www.npmjs.com):

1. Package → **Settings** → **Publishing access** → **Trusted Publisher** → **GitHub Actions**
2. **Organization or user:** `handlemotion`
3. **Repository:** `literature`
4. **Workflow filename:** `publish.yml`
5. **Environment:** leave empty

`repository.url` in each `package.json` must match `github.com/handlemotion/literature` — npm OIDC checks this.

## Bootstrap only (new packages)

Trusted publishing applies to **existing** packages. If a package is not on npm yet, publish once manually after building:

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

Then register trusted publishers above. All subsequent releases go through Changesets + CI.
