# @migration-preflight/postgres

## 0.3.2

### Patch Changes

- [#39](https://github.com/arnaud-zg/migration-preflight/pull/39) [`1eb7ede`](https://github.com/arnaud-zg/migration-preflight/commit/1eb7ede9f80574902aadf0ed2bcdfcbf8ae13ec6) - The README links point to the new docs pages, its first example has every import it needs, and the
  npm keywords are trimmed to the seven that people search for.

- [#31](https://github.com/arnaud-zg/migration-preflight/pull/31) [`a707162`](https://github.com/arnaud-zg/migration-preflight/commit/a7071629b79a67492b18f22fb350de5e6dd06212) - Smaller install: the published build is minified, with source maps and the same exports.

- [#36](https://github.com/arnaud-zg/migration-preflight/pull/36) [`2e8f51a`](https://github.com/arnaud-zg/migration-preflight/commit/2e8f51a8d7ee3ee8395e713c8fe8f8b50700069c) - Accepts any drizzle-orm `0.45.x` from `0.45.2`, and any better-sqlite3 `12.x` from `12.5.0`, instead
  of one exact version: no peer warning on the current patch releases.
- Updated dependencies [[`1eb7ede`](https://github.com/arnaud-zg/migration-preflight/commit/1eb7ede9f80574902aadf0ed2bcdfcbf8ae13ec6), [`a707162`](https://github.com/arnaud-zg/migration-preflight/commit/a7071629b79a67492b18f22fb350de5e6dd06212), [`afd13b9`](https://github.com/arnaud-zg/migration-preflight/commit/afd13b9a4cc0b78091ed89a87d9111288c9bbe68)]:
  - migration-preflight@0.2.2

## 0.3.1

### Patch Changes

- Updated dependencies [[`d15ed97`](https://github.com/arnaud-zg/migration-preflight/commit/d15ed9733c5834d93bcbd2984501237a545fcdc4)]:
  - migration-preflight@0.2.1

## 0.3.0

### Minor Changes

- [#27](https://github.com/arnaud-zg/migration-preflight/pull/27) [`dce258c`](https://github.com/arnaud-zg/migration-preflight/commit/dce258c88c10678d16a2babccaa16daa566299a3) Thanks [@arnaud-zg](https://github.com/arnaud-zg)! - Rename `@migration-preflight/adapters-sqlite` to `@migration-preflight/sqlite` and
  `@migration-preflight/adapters-postgres` to `@migration-preflight/postgres`. Same API and same
  `./drizzle` subpath: replace the package name in your install command and imports. The old names were
  removed from npm.

> Formerly published as `@migration-preflight/adapters-postgres`. Entries up to 0.2.0 were released under that name.

## 0.2.0

### Minor Changes

- ✨ Test any migration history the same way, end to end.
  
  - `prismaFileSource` and `sqlFileSource` join `drizzleFileSource`: read a Prisma `prisma/migrations/`
    directory or a flat folder of numbered `.sql` files, no custom reader required.
  - `applyAll()` replays your whole migration history in one call, no `migrations.at(-1)!.idx` math,
    and it's a safe no-op on an empty history.

### Patch Changes

- Updated dependencies []:
  - migration-preflight@0.2.0

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
- Updated dependencies []:
  - migration-preflight@0.1.1
