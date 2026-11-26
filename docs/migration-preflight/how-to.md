[🏠 Home](../../README.md) · [📚 Docs](../README.md) · `migration-preflight`:
[🚀 Tutorial](./tutorial.md) · **🛠️ How-to** · [📖 Reference](./reference.md) ·
[💡 Explanation](./explanation.md)

# 🛠️ How-to guides: `migration-preflight`

Short recipes, one task each. Every function they use is in the [Reference](./reference.md); every
example they link runs in this repo's tests.

- [Read Prisma or plain SQL migrations](#read-prisma-or-plain-sql-migrations)
- [Test against Postgres](#test-against-postgres)
- [Seed many rows and check each one](#seed-many-rows-and-check-each-one)
- [Check a row's values, or a key not named `id`](#check-a-rows-values-or-a-key-not-named-id)
- [Check that every migration applies](#check-that-every-migration-applies)
- [Load a Postgres extension](#load-a-postgres-extension)
- [Assert foreign key integrity](#assert-foreign-key-integrity)
- [Read another migration format](#read-another-migration-format)

## Read Prisma or plain SQL migrations

Swap the source; everything after it stays the same, as
[examples/sources.ts](../../packages/migration-preflight-sqlite/examples/sources.ts) shows:

```ts
import { prismaFileSource, sqlFileSource } from "migration-preflight/sources";

const fromPrisma = prismaFileSource(join(import.meta.dirname, "prisma/migrations"));
const fromSqlFiles = sqlFileSource(join(import.meta.dirname, "migrations"));
```

| Source              | Reads                                           | Tag                         |
| ------------------- | ----------------------------------------------- | --------------------------- |
| `drizzleFileSource` | `meta/_journal.json`, then each `<tag>.sql`     | the journal's `tag`         |
| `prismaFileSource`  | `<folder>/migration.sql`, folders in name order | the folder name             |
| `sqlFileSource`     | every `<tag>.sql` in the folder, in name order  | the file name, without .sql |

Seeds are keyed by tag, so rename the keys when you switch sources: `0000_create_users` in Drizzle
is `20240101000000_create_users` in Prisma.

A plain SQL file runs as one statement. Split a file that holds more than one with Drizzle's marker,
as
[examples/sql/0001_add_users_bio.sql](../../packages/migration-preflight-sqlite/examples/sql/0001_add_users_bio.sql)
does:

```sql
ALTER TABLE users ADD COLUMN bio text;
--> statement-breakpoint
CREATE INDEX users_email_idx ON users (email);
```

Without it, `node:sqlite` runs only the first statement, with no error, and PGlite throws
`cannot insert multiple commands into a prepared statement`.

## Test against Postgres

1. Install the Postgres adapter instead of the SQLite one:

   ```sh
   npm install --save-dev migration-preflight @migration-preflight/postgres
   ```

2. Build the chain on PGlite:

   ```ts
   import { createPgliteMigrationDatabase } from "@migration-preflight/postgres";

   const chain = new MigrationChain(createPgliteMigrationDatabase(), migrations);
   ```

Seeds, `hasRow` and `getRow` work the same. Foreign keys do not: see
[Assert foreign key integrity](#assert-foreign-key-integrity).

## Seed many rows and check each one

Give each seed its table and row id, then check every one after the replay, as
[examples/seeds.ts](../../packages/migration-preflight-sqlite/examples/seeds.ts) does:

```ts
type Seed = SqlStatement & { readonly table: string; readonly id: string };

const SEEDS_BY_TAG = new Map<string, readonly Seed[]>([
  [
    "0000_create_users",
    [
      {
        table: "users",
        id: "user-1",
        sql: renderInsert("users", { id: "user-1", email: "a@b.com" }),
        params: [],
      },
    ],
  ],
  // one entry per migration tag you seed after
]);

await chain.applyAll((migration) => SEEDS_BY_TAG.get(migration.tag) ?? []);

for (const seed of [...SEEDS_BY_TAG.values()].flat()) {
  expect(await chain.hasRow(seed.table, seed.id)).toBe(true);
}
```

A seed whose tag is not in the history is never inserted, so it fails the check: a typo in a tag
cannot pass silently.

## Check a row's values, or a key not named `id`

`getRow` returns the whole row, so a test can check what a migration did to its columns:

```ts
expect(await chain.getRow("users", "u1")).toEqual({ id: "u1", email: "a@b.com", bio: null });
```

Pass the key column as the third argument when it is not `id`:

```ts
await chain.hasRow("order_line_items", "li1", "order_id");
```

## Check that every migration applies

`applyAll()` with no seeds fails when a migration fails:

```ts
await expect(chain.applyAll()).resolves.toBeUndefined();
```

To run Drizzle's own migrator instead, use the `/drizzle` subpath. It needs `drizzle-orm` (and
`better-sqlite3` for SQLite), as
[examples/smoke.ts](../../packages/migration-preflight-sqlite/examples/smoke.ts) shows:

```ts
import { runDrizzleBetterSqliteMigrations } from "@migration-preflight/sqlite/drizzle";

runDrizzleBetterSqliteMigrations({ migrationsFolder: join(import.meta.dirname, "out") });
```

For Postgres, `await runDrizzlePgliteMigrations({ migrationsFolder })` from
`@migration-preflight/postgres/drizzle`. Either one catches a migration that fails, not one that
drops data: for that, seed a row.

## Load a Postgres extension

When a migration runs `CREATE EXTENSION`, create the PGlite client with that extension and pass it
in, as [examples/extensions.ts](../../packages/migration-preflight-postgres/examples/extensions.ts)
does:

```ts
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const client = new PGlite({ extensions: { pg_trgm } });
const chain = new MigrationChain(createPgliteMigrationDatabase(client), migrations);
// ...
await client.close();
```

`runDrizzlePgliteMigrations({ migrationsFolder, client })` takes the same client. Neither function
closes a client you pass.

## Assert foreign key integrity

- **SQLite**: `foreignKeyViolations()` returns the rows that break a foreign key. Assert
  `toEqual([])` after the replay.
- **Postgres**: `foreignKeyViolations()` always returns `[]`. A violation throws from the statement
  that caused it, so assert `await expect(chain.applyAll(seeds)).rejects.toThrow()` for a seed that
  should break one.

Why they differ: [Explanation](./explanation.md#postgres-checks-foreign-keys-on-write).

## Read another migration format

Write a `MigrationSource`: a function from a folder to `Migration[]` in order.
[examples/custom-source.ts](../../packages/migration-preflight-sqlite/examples/custom-source.ts)
reads the `up` half of a folder of `<tag>.up.sql` and `<tag>.down.sql` files:

```ts
import type { MigrationSource } from "migration-preflight/sources";

export const upSqlFileSource: MigrationSource = (migrationsDir) =>
  readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".up.sql"))
    .sort()
    .map((file, idx) => ({
      idx,
      tag: file.slice(0, -".up.sql".length),
      sql: readFileSync(join(migrationsDir, file), "utf8"),
    }));
```
