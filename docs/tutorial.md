[🏠 Home](../README.md) · **🚀 Tutorial** · [🛠️ How-to](./how-to.md) ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🚀 Getting started

Seed a row, run a migration, prove the row survives. Uses the SQLite adapter; swap in
`@migration-preflight/adapters-postgres` for Postgres (see
[How-to § Pick an adapter](./how-to.md#pick-an-adapter)). Step 2 below covers Drizzle, Prisma, and
plain SQL files, pick whichever matches your project.

## 1. Install

```sh
pnpm add -D migration-preflight @migration-preflight/adapters-sqlite vitest
```

## 2. Point it at your migrations

Every path below ends up producing the same thing: a `migrations` array of `{ idx, tag, sql }`.
Steps 3–5 don't care which one you used to get there, pick whichever matches your project.

<details open>
<summary><b>Drizzle</b> (bundled, no custom code needed)</summary>

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

```ts
import { drizzleFileSource } from "migration-preflight/sources";

const migrations = drizzleFileSource(join(import.meta.dirname, "out"));
```

</details>

<details>
<summary><b>Prisma</b> (also bundled)</summary>

`prismaFileSource` reads a Prisma `prisma/migrations/` directory: each
`<timestamp>_<name>/migration.sql` folder already sorts into the right order as a plain string, no
journal file to parse:

```
prisma/migrations/
├── 20240101000000_create_users/
│   └── migration.sql
└── 20240102000000_add_users_bio/
    └── migration.sql
```

```ts
import { prismaFileSource } from "migration-preflight/sources";

const migrations = prismaFileSource(join(import.meta.dirname, "../prisma/migrations"));
```

</details>

<details>
<summary><b>Plain SQL files</b> (also bundled, no migration tool at all)</summary>

`sqlFileSource` reads a flat folder of numbered `.sql` files, sorted by filename, one statement per
file:

```
migrations/
├── 0000_create_users.sql
└── 0001_add_users_bio.sql
```

```ts
import { sqlFileSource } from "migration-preflight/sources";

const migrations = sqlFileSource(join(import.meta.dirname, "migrations"));
```

More than one statement in a file? See
[How-to § Pick a migration source](./how-to.md#pick-a-migration-source) for the marker that splits
them.

</details>

<details>
<summary><b>Anything else</b> (Knex, TypeORM, your own format)</summary>

Write your own `MigrationSource`, see
[How-to § Add a custom `MigrationSource`](./how-to.md#add-a-custom-migrationsource).

</details>

## 3. Prove the whole history applies cleanly

Using the `migrations` from step 2, shown here with Drizzle; swap the import if you picked Prisma or
plain SQL:

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

Plant a `users` row right after the first migration (`migration.idx === 0`, the same regardless of
which source you picked in step 2), then assert it's still there once every later migration,
including the one adding `bio`, has run:

```ts
import { MigrationChain, renderInsert } from "migration-preflight";

it("keeps an existing user's row through the later migrations", async () => {
  const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);

  await chain.applyThrough(migrations.at(-1)!.idx, (migration) =>
    migration.idx === 0
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

## 6. Scale to more than one seed

`migration.idx === 0` stops scaling once your history has more than a couple of risky migrations.
Model seeds as data instead: an array of `{ after, table, id, sql, params }`, filtered by the
migration's `tag`, not `idx`, a tag is a stable name and doesn't shift when a migration is added or
removed elsewhere in the history. Adding a seed is then a new array entry, not a new branch in the
callback. See [How-to § Seed a row between migrations](./how-to.md#seed-a-row-between-migrations)
for the full pattern.
