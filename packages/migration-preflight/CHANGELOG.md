# migration-preflight

## 0.2.2

### Patch Changes

- [#39](https://github.com/arnaud-zg/migration-preflight/pull/39) [`1eb7ede`](https://github.com/arnaud-zg/migration-preflight/commit/1eb7ede9f80574902aadf0ed2bcdfcbf8ae13ec6) - The README links point to the new docs pages, its first example has every import it needs, and the
  npm keywords are trimmed to the seven that people search for.

- [#31](https://github.com/arnaud-zg/migration-preflight/pull/31) [`a707162`](https://github.com/arnaud-zg/migration-preflight/commit/a7071629b79a67492b18f22fb350de5e6dd06212) - Smaller install: the published build is minified, with source maps and the same exports.

- [#35](https://github.com/arnaud-zg/migration-preflight/pull/35) [`afd13b9`](https://github.com/arnaud-zg/migration-preflight/commit/afd13b9a4cc0b78091ed89a87d9111288c9bbe68) - `hasRow` and `getRow` now escape a double quote inside a table or column name, and a malformed
  Drizzle `meta/_journal.json` fails with an error naming the file instead of a `TypeError`.

## 0.2.1

### Patch Changes

- [#29](https://github.com/arnaud-zg/migration-preflight/pull/29) [`d15ed97`](https://github.com/arnaud-zg/migration-preflight/commit/d15ed9733c5834d93bcbd2984501237a545fcdc4) Thanks [@arnaud-zg](https://github.com/arnaud-zg)! - Update the README to the renamed adapters: `@migration-preflight/sqlite` and
  `@migration-preflight/postgres`.

## 0.2.0

### Minor Changes

- ✨ Test any migration history the same way, end to end.
  
  - `prismaFileSource` and `sqlFileSource` join `drizzleFileSource`: read a Prisma `prisma/migrations/`
    directory or a flat folder of numbered `.sql` files, no custom reader required.
  - `applyAll()` replays your whole migration history in one call, no `migrations.at(-1)!.idx` math,
    and it's a safe no-op on an empty history.

## 0.1.0

### Patch Changes

- First release. Test database migrations against real data before they ship, not after.
  
  A migration can pass every check on an empty local database and still silently drop rows or break
  foreign keys the moment it runs against a database that has real data. This release lets you seed a
  row, replay your migrations through it, and assert the row and its relations survive. No Docker, no
  test database to stand up.
  
  Packages:
  
  - `migration-preflight`: core replay engine, no runtime dependencies
  - `@migration-preflight/adapters-sqlite`: SQLite support (`node:sqlite`)
  - `@migration-preflight/adapters-postgres`: Postgres support (PGlite, in-memory)
