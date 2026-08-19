[🏠 Home](../README.md) · **🚀 Tutorial** · [🛠️ How-to](./how-to.md) ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🚀 Getting started

Seed a row, run a migration, prove the row survives. Uses the SQLite adapter and Drizzle's migration
format: swap in `@migration-preflight/adapters-postgres` for Postgres (see
[How-to § Pick an adapter](./how-to.md#pick-an-adapter)), or Prisma's format instead of Drizzle's
(see [How-to § Use with Prisma](./how-to.md#use-with-prisma)).

## 1. Install

```sh
pnpm add -D migration-preflight @migration-preflight/adapters-sqlite vitest
```

## 2. Point it at your Drizzle migrations

`drizzleFileSource` reads a Drizzle `out/` directory, the same one `drizzle-kit generate` writes:

```
out/
├── meta/_journal.json
├── 0000_create_users.sql
└── 0001_add_users_bio.sql
```

```json
// out/meta/_journal.json
{
  "version": "7",
  "dialect": "sqlite",
  "entries": [
    { "idx": 0, "tag": "0000_create_users" },
    { "idx": 1, "tag": "0001_add_users_bio" }
  ]
}
```

```sql
-- out/0000_create_users.sql
CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL);
```

```sql
-- out/0001_add_users_bio.sql
ALTER TABLE users ADD COLUMN bio text;
```

## 3. Prove the whole history applies cleanly

```ts
// preflight.test.ts
import { join } from "node:path";
import { createNodeSqliteMigrationDatabase } from "@migration-preflight/adapters-sqlite";
import { MigrationChain } from "migration-preflight";
import { drizzleFileSource } from "migration-preflight/sources";
import { describe, expect, it } from "vitest";

const migrations = drizzleFileSource(join(import.meta.dirname, "out"));

describe("migration history", () => {
  it("applies cleanly, start to finish", async () => {
    const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);

    await expect(chain.applyThrough(migrations.at(-1)!.idx, () => [])).resolves.toBeUndefined();
  });
});
```

Catches a migration that fails outright, not one that applies cleanly but quietly drops data. That
needs a seed, next.

## 4. Seed a row before the risky migration, and check it survives

Plant a `users` row right after `0000_create_users`, then assert it's still there once every later
migration, including `0001_add_users_bio`, has run:

```ts
import { MigrationChain, renderInsert } from "migration-preflight";

it("keeps an existing user's row through 0001_add_users_bio", async () => {
  const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);

  await chain.applyThrough(migrations.at(-1)!.idx, (migration) =>
    migration.tag === "0000_create_users"
      ? [{ sql: renderInsert("users", { id: "u1", email: "a@b.com" }), params: [] }]
      : [],
  );

  expect(await chain.hasRow("users", "u1")).toBe(true);
  expect(await chain.getRow("users", "u1")).toMatchObject({ email: "a@b.com" });
  expect(await chain.foreignKeyViolations()).toEqual([]);
});
```

## 5. Run it

```sh
pnpm exec vitest run preflight.test.ts
```

If `0001_add_users_bio` had dropped and recreated `users` instead, `hasRow` would come back `false`
here, caught in a test, not in production.

For seeding real Drizzle-typed rows, Postgres extensions, and picking between adapters, see
[How-to guides](./how-to.md).
