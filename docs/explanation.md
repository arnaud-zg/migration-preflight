[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · [🛠️ How-to](./how-to.md) ·
[📖 Reference](./reference.md) · **💡 Explanation**

# 💡 Explanation

## Why "did it apply" isn't enough

A migration that drops and recreates a table, or renames a column by dropping the old one, applies
cleanly (no error) while destroying every row that was in it. An empty test database can't catch
that; there was never any data to lose. The only way to catch it is to seed a row first, the way
production has rows, and check it's still correct after. Seed, migrate, verify, not just migrate.

## Why three packages, not one

- **The core has zero runtime dependencies.** It only knows the `MigrationSource`,
  `MigrationDatabase`, and `SqlDialect` ports, nothing about Drizzle, SQLite, or Postgres. Testing
  only SQLite never pulls in `@electric-sql/pglite` just because the core exists.
- **Each adapter is its own package** because their runtime footprints differ: the SQLite adapter is
  zero-dependency (`node:sqlite` is a Node builtin), the Postgres adapter always needs PGlite.
- **Within each adapter, the raw driver and the Drizzle-native runner are separate entry points**
  (`.` vs `./drizzle`) for the same reason at a smaller scale: the raw adapter never requires
  installing `drizzle-orm`, only `./drizzle` does.

## Why there's no built-in Prisma or plain-SQL source

`drizzleFileSource` ships because Drizzle's format needs real parsing: a `_journal.json` maps each
migration's `idx`/`tag`, separate from the `.sql` files it points at. Prisma's format doesn't, each
`prisma/migrations/<timestamp>_<name>/migration.sql` folder already sorts into the right order as a
plain string; a flat folder of numbered `.sql` files sorts the same way, one level shallower still.
Reading either is a `readdirSync` and a `readFileSync`, not parsing logic worth a dependency or a
maintained export, see [How-to § Use with Prisma](./how-to.md#use-with-prisma) and
[How-to § Use with plain SQL files](./how-to.md#use-with-plain-sql-files).

## Why `MigrationDatabase` operations can be sync or async

`node:sqlite` is synchronous; PGlite is async-only. `MigrationChain` drives both without an
adapter-specific branch: every port method returns `T | Promise<T>`, and the chain always `await`s,
a no-op on a value that was never a Promise.

## Why `foreignKeyViolations` always returns `[]` on Postgres

SQLite offers a genuine deferred check (`PRAGMA foreign_key_check`), so its `foreignKeyViolations()`
returns real rows. Postgres enforces foreign keys immediately, at write time, with no equivalent
deferred-check query to run afterward: a violation always surfaces as a thrown error from whichever
`run()`/`transaction()` call caused it. Rather than throw on a method the port promises, the
Postgres adapter returns `[]`, integrity holds by construction once a transaction commits. Your test
still catches the violation, just as a thrown error instead of a non-empty array.

## Why the SQLite adapter's pragmas are what they are

`createNodeSqliteMigrationDatabase` enables `enableForeignKeyConstraints` and
`enableDoubleQuotedStringLiterals`. These match how a mobile app's on-device SQLite driver (e.g.
Expo's `expo-sqlite`) commonly runs, so a migration that passes this test behaves the same way once
it reaches a device.

## Why every package builds through tsdown

`dist/` isn't checked in. Each `tsdown.config.ts` calls `@arnaud-zg/configs`'s
`defineLibraryConfig`, builds to ESM, emits `.d.ts`, and regenerates `package.json`'s
`exports`/`main`/`module`/`types` fields from the `entry` map, so that map never drifts out of sync
with `dist/`. `prepublishOnly` runs the build automatically before `npm publish` ever sees the
package.

## Versioning policy

Each package versions independently through [Changesets](https://github.com/changesets/changesets),
not in lockstep: a Postgres-adapter-only fix doesn't force a bump on the SQLite adapter or the core.
`updateInternalDependencies: "patch"` means a core bump also bumps both adapters (which depend on it
via `workspace:*`) by at least a patch, so their published dependency range never goes stale.
`bumpVersionsWithWorkspaceProtocolOnly: true` scopes that auto-bump to `workspace:*` deps
specifically, a no-op today since every internal dependency already uses that protocol, but it
guards against a future one declared with a plain semver range getting silently rewritten too. All
three packages start at `0.1.0`: usable, not yet stable, expect breaking changes signaled by a `0.x`
minor bump until `1.0.0`.

## Why release notes are a separate, idempotent script

`changeset publish` already creates a `<package>@<version>` git tag per bumped package, and
per-package `CHANGELOG.md` is already generated, so a GitHub Release is just those two facts glued
together instead of hand-written: `scripts/release-notes.mjs` walks every package, and for any tag
that doesn't have a release yet, creates one titled after the tag with that package's `## <version>`
CHANGELOG.md section as its notes.

It runs after `pnpm release` and `git push --follow-tags`, not folded into either, because a git tag
isn't a GitHub Release: `gh release create <tag>` needs the tag to already exist on the remote, and
creating it against a local-only tag would tag the wrong commit (the branch tip, not the real
release commit). Checking "does a release already exist" instead of "was this tag just created" also
makes the script idempotent: re-running it after a partial failure, or once against tags that
predate the script, only fills in what's missing.

## Why the tsconfig split (`tsconfig.json` / `.build.json` / `.typecheck.json`)

- **`tsconfig.json`**: what editors and ESLint's typed linting resolve. Extends
  `@arnaud-zg/configs/tsconfig/internal-package.json`.
- **`tsconfig.build.json`**: what `tsdown` compiles with. Isolated from the monorepo-wide settings
  above because tsdown's isolated-declarations `.d.ts` build needs a leaner, self-contained config.
- **`tsconfig.typecheck.json`**: what `pnpm typecheck` runs. Excludes `*.spec.ts` / `*.test.ts`;
  those get type checking from ESLint's typed-linting pass instead, so nothing goes unchecked but
  each config has one job.

## Known issue: PGlite memory use in tests

Each `@electric-sql/pglite` instance is a full WASM-compiled Postgres, roughly 700MB+ peak RSS on
its own. The Postgres adapter's own test suite shares one instance across all its tests
(`isolate: false`, `fileParallelism: false` in its `vitest.config.ts`) to pay that cost once, but a
consuming project that boots several PGlite instances across parallel test files can still see high
memory use, particularly in CI with limited memory per runner.
