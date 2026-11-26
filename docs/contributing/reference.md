[🏠 Home](../../README.md) · [📚 Docs](../README.md) · Contributing: [🛠️ How-to](./how-to.md) · **📖
Reference** · [💡 Explanation](./explanation.md)

# 📖 Reference: Contributing

## Layout

```
packages/
  migration-preflight/              core: replay engine and ports, zero runtime dependencies
    src/index.ts                    MigrationChain, its ports, renderInsert, splitIntoStatements
    src/sources.ts                  the "./sources" entry: Drizzle, Prisma and SQL file sources
  migration-preflight-sqlite/       @migration-preflight/sqlite
    src/index.ts                    the node:sqlite MigrationDatabase
    src/drizzle.ts                  the "./drizzle" entry: drizzle's better-sqlite3 migrator
    examples/                       migrations and code the docs link
  migration-preflight-postgres/     @migration-preflight/postgres
    src/index.ts                    the PGlite MigrationDatabase
    src/drizzle.ts                  the "./drizzle" entry: drizzle's PGlite migrator
    examples/                       code the docs link
docs/                               this documentation
.github/workflows/ship.yml          releases through shiplane
```

Each package's `src/examples.integration.test.ts` runs its `examples/`; start with
[examples/preflight.ts](../../packages/migration-preflight-sqlite/examples/preflight.ts). Each
package's `dist/` (built by `tsdown`, gitignored) is what its `package.json` `exports` resolve to.

## Scripts

| Script (from repo root)        | Runs                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `pnpm lint`                    | `eslint .`                                                                           |
| `pnpm lint:md`                 | `remark . --frail --quiet`                                                           |
| `pnpm format` / `format:check` | `prettier --write .` / `prettier --check .`                                          |
| `pnpm typecheck`               | `tsc -p tsconfig.typecheck.json` in every package                                    |
| `pnpm test`                    | `vitest run` in every package                                                        |
| `pnpm test:mutate`             | Stryker mutation testing in every package, fails under 70% killed; slow, run by hand |
| `pnpm build`                   | `tsdown` in every package                                                            |
| `pnpm verify`                  | typecheck, lint, lint:md, format:check, test, build                                  |
| `pnpm changeset`               | records a pending version bump, see [Changeset rules](#changeset-rules)              |
| `pnpm release`                 | `pnpm build && shiplane`, see [How-to](./how-to.md#release-a-new-version)            |
| `pnpm shiplane status`         | what each package would release next                                                 |

Source: the root `package.json`.

## Changeset rules

| The pull request changes                                                    | Changeset                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------- |
| a package's `src`: a fix, perf or refactor                                  | `--patch`                                      |
| a package's `src`: a feature, or a breaking change below 1.0.0              | `--minor`                                      |
| a package `README.md`, or `description` or `keywords` in its `package.json` | `--patch`: npm only shows them after a release |
| docs under `docs/`, examples, tooling, CI                                   | none                                           |

```sh
pnpm changeset --patch migration-preflight -m "What now works."
```

The public API is `src/index.ts`, `src/sources.ts` and `src/drizzle.ts`: a breaking change there
needs a `--minor` that says so. A core bump also bumps both adapters by a patch, see
[Explanation](./explanation.md#versioning-policy).

## Findability rules

For each published package. Why: see
[Explanation](./explanation.md#the-packages-are-written-to-be-found).

| Where                      | Rule                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `description`              | One plain sentence, under 160 characters: what it does and the database or tool it works with |
| `keywords`                 | 3 to 7 tags with a big community (`database`, `migration`, `testing`, `drizzle`...)           |
| `homepage`, `repository`   | The package's README on GitHub, and `directory: packages/<folder>`                            |
| README, top                | The problem in the reader's words, then one picture of the result                             |
| README, first code example | Complete, `import` lines included                                                             |
| Root README                | One line per package, linking to its README. Details stay in the package README               |

## Link rules

A reader goes from one page to the next without landing on a folder listing.

| Link                     | Rule                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| To a doc or a package    | A specific `.md` file, never its folder                                                              |
| Package README to docs   | One link per page: 🚀 Tutorial, 🛠️ How-to, 📖 Reference, 💡 Explanation                              |
| In a package README      | An absolute `https://github.com/arnaud-zg/migration-preflight/blob/main/...` URL, so it works on npm |
| Top of every `docs` page | The nav bar: 🏠 Home, 📚 Docs, then every sibling page                                               |
| To an example            | The file to read first, not the `examples/` folder                                                   |
