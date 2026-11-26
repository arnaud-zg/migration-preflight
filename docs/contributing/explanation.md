[🏠 Home](../../README.md) · [📚 Docs](../README.md) · Contributing: [🛠️ How-to](./how-to.md) ·
[📖 Reference](./reference.md) · **💡 Explanation**

# 💡 Explanation: Contributing

Why the repo is built and released the way it is. Why the library works the way it does:
[Explanation](../migration-preflight/explanation.md).

## The repo holds three published packages

`migration-preflight` is the core; `@migration-preflight/sqlite` and `@migration-preflight/postgres`
each add one database. They live in one pnpm workspace so a change to a port and to both adapters
lands in one pull request, and the toolchain matches the other `arnaud-zg` repos
(`@arnaud-zg/configs`, shiplane, Changesets).

## Versioning policy

Each package versions on its own through [Changesets](https://github.com/changesets/changesets): a
Postgres-only fix does not bump the SQLite adapter or the core.
`updateInternalDependencies: "patch"` means a core bump also bumps both adapters (which depend on it
through `workspace:*`) by at least a patch, so their published dependency range never goes stale.
`bumpVersionsWithWorkspaceProtocolOnly: true` limits that to `workspace:*` dependencies.

Below `1.0.0`, a minor version means "new" or "breaking", and the changelog says which; a patch only
ever means "fixed". Changesets never picks the bump, so the one who writes the changeset applies
this rule.

## Every package builds through tsdown

`dist/` is not checked in. Each `tsdown.config.ts` builds through the shared `tsdown.library.mjs`:
minified ESM, source maps, `.d.ts`, and `package.json`'s `exports`/`main`/`module`/`types` written
from the `entry` map, so they never drift from `dist/`. `prepublishOnly` builds before any
`npm publish`.

## Each tsconfig has one job

- **`tsconfig.json`**: what editors and ESLint's typed linting resolve, `src`, `examples` and the
  config files.
- **`tsconfig.build.json`**: what `tsdown` compiles with: `src` only, self-contained, for its
  isolated-declarations `.d.ts` build.
- **`tsconfig.typecheck.json`**: what `pnpm typecheck` runs: `src` and `examples`, without the
  tests, which ESLint's typed linting checks instead.

## The packages are written to be found

Nobody promotes these packages: people find them through npm search, web search or an AI assistant.

- **npm search** ranks on the name, `description` and `keywords`, then the README.
- **Web search** matches what people type, often the problem in their own words.
- **AI assistants** recommend what they can describe and quote: a plain description and a first
  example that works when pasted.
- **npm shows the published `package.json` and README**, so a change to either needs a release to
  show. That is why it needs a patch changeset.

## Examples are run, not pasted

A snippet pasted into a page goes stale silently. The docs link files in each package's `examples/`
instead, and `src/examples.integration.test.ts` runs them against the source on every `pnpm test`,
so a page cannot show an example that no longer works.
