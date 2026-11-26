[🏠 Home](../../README.md) · [📚 Docs](../README.md) · `migration-preflight`:
[🚀 Tutorial](./tutorial.md) · [🛠️ How-to](./how-to.md) · **📖 Reference** ·
[💡 Explanation](./explanation.md)

# 📖 Reference: `migration-preflight`

Every export of the three packages, with its signature. Source: each package's `src/index.ts`,
`src/sources.ts` and `src/drizzle.ts`; the examples that call them are in
[examples/](../../packages/migration-preflight-sqlite/examples/preflight.ts).

## Packages and exports

| Package                         | Subpath     | Resolves to       | Needs                                     |
| ------------------------------- | ----------- | ----------------- | ----------------------------------------- |
| `migration-preflight`           | `.`         | `dist/index.js`   | nothing (zero runtime deps)               |
| `migration-preflight`           | `./sources` | `dist/sources.js` | `node:fs` / `node:path` only              |
| `@migration-preflight/sqlite`   | `.`         | `dist/index.js`   | nothing (`node:sqlite` is a Node builtin) |
| `@migration-preflight/sqlite`   | `./drizzle` | `dist/drizzle.js` | `drizzle-orm`, `better-sqlite3`           |
| `@migration-preflight/postgres` | `.`         | `dist/index.js`   | `@electric-sql/pglite`                    |
| `@migration-preflight/postgres` | `./drizzle` | `dist/drizzle.js` | `@electric-sql/pglite`, `drizzle-orm`     |

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
- `hasRow` / `getRow`: query by `idColumn` (defaults to `"id"`); the table and column names are
  double-quoted, with any `"` in them doubled, so a reserved word (Postgres's `user`) still
  resolves.
- `foreignKeyViolations()`: delegates to the adapter, see
  [How-to § Assert foreign key integrity](./how-to.md#assert-foreign-key-integrity).

### Ports

Source: `packages/migration-preflight/src/migrationChain.ports.ts`.

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
[How-to § Read another migration format](./how-to.md#read-another-migration-format).

## `@migration-preflight/sqlite` API

| Export                                                         | From        |
| -------------------------------------------------------------- | ----------- |
| `createNodeSqliteMigrationDatabase(): MigrationDatabase`       | `.`         |
| `runDrizzleBetterSqliteMigrations({ migrationsFolder }): void` | `./drizzle` |

`dialect.placeholder` renders SQLite's `?`. `foreignKeyViolations()` runs
`PRAGMA foreign_key_check`.

## `@migration-preflight/postgres` API

| Export                                                                     | From        |
| -------------------------------------------------------------------------- | ----------- |
| `createPgliteMigrationDatabase(client?: PGlite): MigrationDatabase`        | `.`         |
| `runDrizzlePgliteMigrations({ migrationsFolder, client? }): Promise<void>` | `./drizzle` |

`dialect.placeholder` renders Postgres's `$1`, `$2`, etc. `foreignKeyViolations()` always returns
`[]`, see [Explanation](./explanation.md#postgres-checks-foreign-keys-on-write). Pass your own
`client` for a PGlite extension (see
[How-to § Load a Postgres extension](./how-to.md#load-a-postgres-extension)); without one, a bare
in-memory `PGlite` instance is created (and, for `runDrizzlePgliteMigrations`, closed) for you.
