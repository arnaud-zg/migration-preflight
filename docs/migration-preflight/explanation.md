[🏠 Home](../../README.md) · [📚 Docs](../README.md) · `migration-preflight`:
[🚀 Tutorial](./tutorial.md) · [🛠️ How-to](./how-to.md) · [📖 Reference](./reference.md) · **💡
Explanation**

# 💡 Explanation: `migration-preflight`

Why the library works the way it does. How the repo is built and released:
[Contributing explanation](../contributing/explanation.md).

## A migration that applies can still lose data

An empty database has nothing to lose, so a migration that drops and recreates a table applies there
without an error. Only a row that exists before the migration shows the loss: plant one, migrate,
then check it. The [Tutorial](./tutorial.md#5-break-the-second-migration) ends on exactly that case.

## The core knows no database, so you install only the one you test

- **The core has zero runtime dependencies.** It only knows the `MigrationSource`,
  `MigrationDatabase`, and `SqlDialect` ports, nothing about Drizzle, SQLite, or Postgres. Testing
  only SQLite never pulls in `@electric-sql/pglite` just because the core exists.
- **Each adapter is its own package** because their runtime footprints differ: the SQLite adapter is
  zero-dependency (`node:sqlite` is a Node builtin), the Postgres adapter always needs PGlite.
- **Within each adapter, the raw driver and the Drizzle-native runner are separate entry points**
  (`.` vs `./drizzle`) for the same reason at a smaller scale: the raw adapter never requires
  installing `drizzle-orm`, only `./drizzle` does.

## Reading a migration folder is too small to need a plugin

None of the three need real parsing. `drizzleFileSource` reads a `_journal.json` that maps each
migration's `idx`/`tag`, separate from the `.sql` files it points at; `prismaFileSource`'s
`prisma/migrations/<timestamp>_<name>/migration.sql` folders and `sqlFileSource`'s flat folder of
`<tag>.sql` files both already sort into the right order as plain strings, no journal needed. Each
is a `readdirSync` and a `readFileSync`, trivial enough that shipping all three costs the core
package nothing (no new runtime dependency), and saves every consumer from hand-rolling the same
handful of lines. Anything else (Knex, TypeORM, a custom format) still needs one, see
[How-to § Read another migration format](./how-to.md#read-another-migration-format).

## One chain drives a sync and an async driver

`node:sqlite` is synchronous; PGlite is async-only. `MigrationChain` drives both without an
adapter-specific branch: every port method returns `T | Promise<T>`, and the chain always `await`s,
a no-op on a value that was never a Promise.

## Postgres checks foreign keys on write

SQLite offers a genuine deferred check (`PRAGMA foreign_key_check`), so its `foreignKeyViolations()`
returns real rows. Postgres enforces foreign keys immediately, at write time, with no equivalent
deferred-check query to run afterward: a violation always surfaces as a thrown error from whichever
`run()`/`transaction()` call caused it. Rather than throw on a method the port promises, the
Postgres adapter returns `[]`, integrity holds by construction once a transaction commits. Your test
still catches the violation, just as a thrown error instead of a non-empty array.

## The SQLite adapter runs like a device's SQLite

`createNodeSqliteMigrationDatabase` enables `enableForeignKeyConstraints` and
`enableDoubleQuotedStringLiterals`. These match how a mobile app's on-device SQLite driver (e.g.
Expo's `expo-sqlite`) commonly runs, so a migration that passes this test behaves the same way once
it reaches a device.

## Each PGlite instance costs hundreds of megabytes

Each `@electric-sql/pglite` instance is a full WASM-compiled Postgres, roughly 700MB+ peak RSS on
its own. The Postgres adapter's own test suite shares one instance across all its tests
(`isolate: false`, `fileParallelism: false` in its `vitest.config.ts`) to pay that cost once, but a
consuming project that boots several PGlite instances across parallel test files can still see high
memory use, particularly in CI with limited memory per runner.
