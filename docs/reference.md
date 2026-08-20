[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · [🛠️ How-to](./how-to.md) · **📖 Reference**
· [💡 Explanation](./explanation.md)

# 📖 Reference

## Packages and exports

| Package                                  | Subpath     | Resolves to       | Needs                                     |
| ---------------------------------------- | ----------- | ----------------- | ----------------------------------------- |
| `migration-preflight`                    | `.`         | `dist/index.js`   | nothing (zero runtime deps)               |
| `migration-preflight`                    | `./sources` | `dist/sources.js` | `node:fs` / `node:path` only              |
| `@migration-preflight/adapters-sqlite`   | `.`         | `dist/index.js`   | nothing (`node:sqlite` is a Node builtin) |
| `@migration-preflight/adapters-sqlite`   | `./drizzle` | `dist/drizzle.js` | `drizzle-orm`, `better-sqlite3`           |
| `@migration-preflight/adapters-postgres` | `.`         | `dist/index.js`   | `@electric-sql/pglite`                    |
| `@migration-preflight/adapters-postgres` | `./drizzle` | `dist/drizzle.js` | `@electric-sql/pglite`, `drizzle-orm`     |

`drizzle-orm` and `better-sqlite3` are optional peer deps on the adapters, install at whatever
version your project already uses. Only the `./drizzle` subpath needs them.

## `migration-preflight` API

### `MigrationChain`

```ts
class MigrationChain {
  constructor(database: MigrationDatabase, migrations: readonly Migration[]);

  ordered(): readonly Migration[];

  applyThrough(
    maxIdx: number,
    seedsAfter: (migration: Migration) => readonly SqlStatement[],
  ): Promise<void>;

  applyAll(seedsAfter?: (migration: Migration) => readonly SqlStatement[]): Promise<void>;

  hasRow(table: string, id: string, idColumn?: string): Promise<boolean>;
  getRow(table: string, id: string, idColumn?: string): Promise<SqlRow | undefined>;
  foreignKeyViolations(): Promise<SqlRow[]>;
}
```

- `applyThrough(maxIdx, seedsAfter)`: runs every migration whose `idx <= maxIdx`, in order, inside
  one transaction; after each migration's statements, runs whatever `seedsAfter(migration)` returns.
- `applyAll(seedsAfter?)`: `applyThrough` against the whole history, without computing `maxIdx`
  yourself; `seedsAfter` defaults to seeding nothing. A no-op on an empty history, rather than
  throwing.
- `hasRow` / `getRow`: query by `idColumn` (defaults to `"id"`); the table name is always
  double-quoted, so a reserved-word table name (Postgres's `user`, for example) still resolves.
- `foreignKeyViolations()`: delegates to the adapter, see
  [How-to § Assert on foreign key integrity](./how-to.md#assert-on-foreign-key-integrity).

### Ports (`migrationChain.ports`)

| Type                | Shape                                                        |
| ------------------- | ------------------------------------------------------------ |
| `SqlValue`          | `string \| number \| null`                                   |
| `SqlRow`            | `Record<string, unknown>`                                    |
| `SqlStatement`      | `{ sql: string; params: readonly SqlValue[] }`               |
| `Migration`         | `{ idx: number; tag: string; sql: string }`                  |
| `SqlDialect`        | `{ placeholder: (index: number) => string }`                 |
| `MigrationDatabase` | `{ dialect, run, query, transaction, foreignKeyViolations }` |

```ts
interface MigrationDatabase {
  readonly dialect: SqlDialect;
  run: (sql: string, parameters?: readonly SqlValue[]) => Promise<void> | void;
  query: (sql: string, parameters?: readonly SqlValue[]) => Promise<SqlRow[]> | SqlRow[];
  transaction: (work: () => Promise<void> | void) => Promise<void> | void;
  foreignKeyViolations: () => Promise<SqlRow[]> | SqlRow[];
}
```

Every operation may be sync or async, so one `MigrationChain` drives both a synchronous driver
(`node:sqlite`) and an async-only one (PGlite).

### `migrationSql`

| Export                              | Signature                                                               |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `splitIntoStatements(migrationSql)` | `(sql: string) => string[]`, splits on `--> statement-breakpoint`       |
| `renderInsert(table, row)`          | `(table: string, row: Record<string, SqlValue \| undefined>) => string` |

### `migration-preflight/sources`

| Export                           | Signature                                                        |
| -------------------------------- | ---------------------------------------------------------------- |
| `drizzleFileSource`              | `MigrationSource`, reads a Drizzle `out/` directory              |
| `loadMigrationsFromDisk(outDir)` | `(outDir: string) => Migration[]`, same, named directly          |
| `prismaFileSource`               | `MigrationSource`, reads a Prisma `prisma/migrations/` directory |
| `sqlFileSource`                  | `MigrationSource`, reads a flat folder of `<tag>.sql` files      |
| `MigrationSource` (type)         | `(migrationsDir: string) => readonly Migration[]`                |

Any other migration tool isn't a bundled export: write your own `MigrationSource`, see
[How-to § Add a custom `MigrationSource`](./how-to.md#add-a-custom-migrationsource).

## `@migration-preflight/adapters-sqlite` API

| Export                                                         | From        |
| -------------------------------------------------------------- | ----------- |
| `createNodeSqliteMigrationDatabase(): MigrationDatabase`       | `.`         |
| `runDrizzleBetterSqliteMigrations({ migrationsFolder }): void` | `./drizzle` |

`dialect.placeholder` renders SQLite's `?`. `foreignKeyViolations()` runs
`PRAGMA foreign_key_check`.

## `@migration-preflight/adapters-postgres` API

| Export                                                                     | From        |
| -------------------------------------------------------------------------- | ----------- |
| `createPgliteMigrationDatabase(client?: PGlite): MigrationDatabase`        | `.`         |
| `runDrizzlePgliteMigrations({ migrationsFolder, client? }): Promise<void>` | `./drizzle` |

`dialect.placeholder` renders Postgres's `$1`, `$2`, etc. `foreignKeyViolations()` always returns
`[]`, see [Explanation](./explanation.md#why-foreignkeyviolations-always-returns--on-postgres). Pass
your own `client` for a PGlite extension (see
[How-to § Load Postgres extensions](./how-to.md#load-postgres-extensions-eg-pg_trgm)); without one,
a bare in-memory `PGlite` instance is created (and, for `runDrizzlePgliteMigrations`, closed) for
you.

## Package layout

```
packages/
  migration-preflight/                       core: replay engine + ports (zero runtime deps)
    src/domain/migrations/                    MigrationChain, ports, migrationSql
    src/sources/                              drizzleFileSource (the "./sources" entry point)
  migration-preflight-adapters-sqlite/        node:sqlite adapter
    src/nodeSqliteMigrationDatabase.adapter.ts  the raw MigrationDatabase adapter
    src/drizzleBetterSqliteRunner.ts            the "./drizzle" apply-clean runner
  migration-preflight-adapters-postgres/      PGlite adapter
    src/pgliteMigrationDatabase.adapter.ts      the raw MigrationDatabase adapter
    src/drizzlePgliteRunner.ts                  the "./drizzle" apply-clean runner
docs/                                        this documentation
```

Each package's `dist/` (built by `tsdown`, gitignored) is what its `package.json` `exports` actually
resolve to.

## Scripts (for contributors to this repo)

| Script (from repo root)        | Runs                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm lint`                    | `eslint .`                                                                         |
| `pnpm lint:md`                 | `remark . --frail --quiet`                                                         |
| `pnpm format` / `format:check` | `prettier --write .` / `prettier --check .`                                        |
| `pnpm typecheck`               | `tsc -p tsconfig.typecheck.json` in every package                                  |
| `pnpm test`                    | `vitest run` in every package, including the Postgres adapter's `test:db`          |
| `pnpm build`                   | `tsdown` in every package                                                          |
| `pnpm verify`                  | typecheck, lint, lint:md, format:check, test, build                                |
| `pnpm changeset`               | records a pending version bump, see [How-to](./how-to.md#release-a-new-version)    |
| `pnpm release`                 | `pnpm build && changeset publish`, see [How-to](./how-to.md#release-a-new-version) |
| `pnpm release:notes`           | `node scripts/release-notes.mjs`, see [How-to](./how-to.md#release-a-new-version)  |
