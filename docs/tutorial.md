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
<summary><b>Drizzle</b> — bundled, no custom code needed</summary>

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
<summary><b>Prisma</b></summary>

`prisma/migrations/<timestamp>_<name>/migration.sql` already sorts into the right order as plain
strings, no journal file to parse:

```
prisma/migrations/
├── 20240101000000_create_users/
│   └── migration.sql
└── 20240102000000_add_users_bio/
    └── migration.sql
```

```ts
// prismaFileSource.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Migration, MigrationSource } from "migration-preflight/sources";

export const prismaFileSource: MigrationSource = (migrationsDir) =>
  readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((tag, idx): Migration => ({
      idx,
      tag,
      sql: readFileSync(join(migrationsDir, tag, "migration.sql"), "utf8"),
    }));

const migrations = prismaFileSource(join(import.meta.dirname, "../prisma/migrations"));
```

Full recipe, including which other guides apply as-is:
[How-to § Use with Prisma](./how-to.md#use-with-prisma).

</details>

<details>
<summary><b>Plain SQL files</b> — no migration tool at all</summary>

A flat folder of numbered `.sql` files, sorted by filename, one statement per file:

```
migrations/
├── 0000_create_users.sql
└── 0001_add_users_bio.sql
```

```ts
// sqlFileSource.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Migration, MigrationSource } from "migration-preflight/sources";

export const sqlFileSource: MigrationSource = (migrationsDir) =>
  readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file, idx): Migration => ({
      idx,
      tag: file.replace(/\.sql$/, ""),
      sql: readFileSync(join(migrationsDir, file), "utf8"),
    }));

const migrations = sqlFileSource(join(import.meta.dirname, "migrations"));
```

Full recipe, including how to handle more than one statement per file:
[How-to § Use with plain SQL files](./how-to.md#use-with-plain-sql-files).

</details>

## 3. Prove the whole history applies cleanly

Using the `migrations` from step 2, shown here with Drizzle; swap in your own if you picked Prisma
or plain SQL:

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
