# @migration-preflight/adapters-postgres

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
