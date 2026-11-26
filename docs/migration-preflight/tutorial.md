[🏠 Home](../../README.md) · [📚 Docs](../README.md) · `migration-preflight`: **🚀 Tutorial** ·
[🛠️ How-to](./how-to.md) · [📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🚀 Tutorial: prove a row survives your migrations

New here? Do this once, in order: 5 steps, about 10 minutes.

You will:

1. replay a two-migration Drizzle history on SQLite, with a row seeded after the first one;
2. see the test pass, because the second migration keeps the row;
3. break the second migration and see the same test catch the lost row.

## Before you start

- Node 22.13 or later, where `node:sqlite` needs no flag: `node --version`.
- An empty folder with a `package.json` that has `"type": "module"`.

## 1. Install the packages

```sh
npm install --save-dev migration-preflight @migration-preflight/sqlite vitest
```

## 2. Add the migrations

Copy the `examples/drizzle` folder, which starts with
[examples/drizzle/0000_create_users.sql](../../packages/migration-preflight-sqlite/examples/drizzle/0000_create_users.sql),
into your folder as `out/`. It is what `drizzle-kit generate` writes:

```
out/
├── meta/_journal.json
├── 0000_create_users.sql   CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL);
└── 0001_add_users_bio.sql  ALTER TABLE users ADD COLUMN bio text;
```

## 3. Write the test

Save this as `preflight.test.ts`. The replay part is
[examples/preflight.ts](../../packages/migration-preflight-sqlite/examples/preflight.ts), which this
repo's tests run.

```ts
import { join } from "node:path";
import type { SqlStatement } from "migration-preflight";
import { createNodeSqliteMigrationDatabase } from "@migration-preflight/sqlite";
import { MigrationChain, renderInsert } from "migration-preflight";
import { drizzleFileSource } from "migration-preflight/sources";
import { expect, it } from "vitest";

const migrations = drizzleFileSource(join(import.meta.dirname, "out"));

const seedsByTag = new Map<string, readonly SqlStatement[]>([
  [
    "0000_create_users",
    [{ sql: renderInsert("users", { id: "u1", email: "a@b.com" }), params: [] }],
  ],
]);

it("keeps an existing user through every later migration", async () => {
  const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);

  await chain.applyAll((migration) => seedsByTag.get(migration.tag) ?? []);

  expect(await chain.hasRow("users", "u1")).toBe(true);
});
```

`applyAll` runs every migration in order and, right after `0000_create_users`, inserts the `u1` row.

## 4. Run it

```sh
npx vitest run
```

You should see:

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Adding the `bio` column kept `u1`.

## 5. Break the second migration

Replace `out/0001_add_users_bio.sql` with a migration that rebuilds the table, as
[examples/drizzle-drops-users](../../packages/migration-preflight-sqlite/examples/drizzle-drops-users/0001_rebuild_users.sql)
does:

```sql
DROP TABLE users;
--> statement-breakpoint
CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL, bio text);
```

Run `npx vitest run` again. You should see:

```
 FAIL  preflight.test.ts > keeps an existing user through every later migration
AssertionError: expected false to be true // Object.is equality
```

The migration applied without an error, and the row is gone. An empty database would never show it.

## Next

- Read a Prisma or plain SQL folder instead:
  [How-to](./how-to.md#read-prisma-or-plain-sql-migrations).
- Test against Postgres: [How-to](./how-to.md#test-against-postgres).
- Seed many rows and check each one: [How-to](./how-to.md#seed-many-rows-and-check-each-one).
