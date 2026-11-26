[🏠 Home](../../README.md) · [📚 Docs](../README.md) · Contributing: **🛠️ How-to** ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🛠️ How-to guides: Contributing

Your first pull request is walked through in [CONTRIBUTING.md](../../CONTRIBUTING.md). These are the
maintainer's tasks.

- [Run this repo's checks](#run-this-repos-checks)
- [Release a new version](#release-a-new-version)
- [Publish from GitHub Actions](#publish-from-github-actions)
- [Add an example the docs show](#add-an-example-the-docs-show)
- [Keep the packages findable](#keep-the-packages-findable)
- [Deprecate a package on npm](#deprecate-a-package-on-npm)

## Run this repo's checks

```sh
pnpm install
pnpm verify   # typecheck, lint, lint:md, format:check, test, build
```

No CI runs it on pull requests: run it before asking for a review. One package only:

```sh
pnpm --filter @migration-preflight/sqlite test
```

## Release a new version

Releases go through [shiplane](https://www.npmjs.com/package/shiplane), with
[Changesets](https://github.com/changesets/changesets) for the versions. Nobody pushes to `main`
directly.

1. Each pull request that changes a package carries its changeset (see
   [Changeset rules](./reference.md#changeset-rules)).
2. On `main`, with changesets pending, open the release pull request:

   ```sh
   git checkout main && git pull
   pnpm shiplane status   # what is pending, per package
   pnpm release           # opens the release PR
   ```

3. Merge it, then run `pnpm release` again on `main`. It tags each bumped package, publishes it to
   npm and writes its GitHub Release from the `CHANGELOG.md` entry. It asks where to publish from:
   GitHub Actions or this machine. It needs `gh` and `npm` signed in.

## Publish from GitHub Actions

GitHub Actions runs [`ship.yml`](../../.github/workflows/ship.yml), written by `shiplane doctor`.
Start it yourself, with **dry-run** to only look:

```sh
gh workflow run ship.yml --ref main -f environment=nightly -f dry-run=true
```

| Environment                      | Branch | npm gets                                       |
| -------------------------------- | ------ | ---------------------------------------------- |
| `snapshot`                       | any    | `<next>-<branch>.<sha>`, no tag kept           |
| `nightly`, `alpha`, `beta`, `rc` | `main` | `<next>-<channel>.<n>` under that tag          |
| `latest`                         | `main` | the merged release PR's version under `latest` |

One-time setup, from your own terminal (npm asks for 2FA): trust the workflow for each package, so
it publishes with no token.

```sh
npx -y npm@^11.21.0 trust github migration-preflight --file ship.yml \
  --repo arnaud-zg/migration-preflight --allow-publish -y
npx -y npm@^11.21.0 trust github @migration-preflight/sqlite --file ship.yml \
  --repo arnaud-zg/migration-preflight --allow-publish -y
npx -y npm@^11.21.0 trust github @migration-preflight/postgres --file ship.yml \
  --repo arnaud-zg/migration-preflight --allow-publish -y
```

After a shiplane upgrade, run `pnpm shiplane doctor`: it moves the pin in `ship.yml`.

## Add an example the docs show

1. Add the file to `packages/migration-preflight-sqlite/examples/` (or the Postgres package's),
   importing the packages by their npm names, as
   [examples/preflight.ts](../../packages/migration-preflight-sqlite/examples/preflight.ts) does.
2. Run it in that package's `src/examples.integration.test.ts`, asserting what the page says it
   does.
3. Link the file from the page; never paste a copy that no test runs.

The package's `vitest.config.ts` maps the npm names to `src`, and its tsconfigs map them for `tsc`
and ESLint, so examples run and type-check without a build.

## Keep the packages findable

When you change a package README, or `description` or `keywords` in its `package.json`:

1. Check the change against the [Findability rules](./reference.md#findability-rules).
2. Add a patch changeset for that package:

   ```sh
   pnpm changeset --patch @migration-preflight/sqlite -m "Clearer npm description and keywords."
   ```

3. After the release, check what npm shows:

   ```sh
   npm view @migration-preflight/sqlite description keywords
   ```

## Deprecate a package on npm

When a package stops being published, deprecate it rather than unpublish it: old versions that
depend on it keep installing.

```sh
npm whoami
npm deprecate <package> "No longer maintained; <what to use instead>."
npm view <package> deprecated
```

An empty message (`npm deprecate <package> ""`) undoes it. To deprecate one version only, name it:
`npm deprecate <package>@<version> "<why>"`.
