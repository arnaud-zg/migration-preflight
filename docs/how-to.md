[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · **🛠️ How-to** ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🛠️ How-to guides

## Pick an adapter

| You're testing | Install                                  | Zero runtime deps?                                                    |
| -------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| SQLite         | `@migration-preflight/adapters-sqlite`   | Yes, `node:sqlite` is a Node builtin                                  |
| Postgres       | `@migration-preflight/adapters-postgres` | No, pulls in [PGlite](https://pglite.dev), an in-memory WASM Postgres |

Both are dev dependencies. Install only the one matching your database.

## Pick a migration source

Every source is a `MigrationSource`: `(migrationsDir: string) => readonly Migration[]`. Three ship
with the core package, all importable from `migration-preflight/sources`:

| You're using    | Import              | Reads                                                        |
| --------------- | ------------------- | ------------------------------------------------------------ |
| Drizzle         | `drizzleFileSource` | `out/meta/_journal.json` + `<tag>.sql`, drizzle-kit's output |
| Prisma          | `prismaFileSource`  | `prisma/migrations/<timestamp>_<name>/migration.sql`         |
| Plain SQL files | `sqlFileSource`     | A flat folder of `<tag>.sql`, sorted by filename             |
| Anything else   | n/a                 | [Write your own](#add-a-custom-migrationsource)              |

```ts
import { prismaFileSource } from "migration-preflight/sources"; // or drizzleFileSource, sqlFileSource

const migrations = prismaFileSource(join(import.meta.dirname, "../prisma/migrations"));
const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);
```

Everything below (seeding, foreign key assertions) works the same no matter which source produced
`migrations`, except the [`/drizzle` smoke test](#run-a-quick-does-it-apply-cleanly-smoke-test):
it's specific to Drizzle's own journal format, so it doesn't apply to Prisma or plain SQL files.

**Plain SQL files: one statement per file is safest.** `MigrationChain` runs each migration's SQL as
a single prepared statement, and an unmarked multi-statement file behaves differently per dialect:
`node:sqlite` silently runs only the first statement and drops the rest, no error, while PGlite
throws `cannot insert multiple commands into a prepared statement`. Need more than one statement in
a file? Separate them with Drizzle's own marker, the same one `splitIntoStatements` already looks
for regardless of source:

```sql
CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL);
--> statement-breakpoint
CREATE INDEX users_email_idx ON users (email);
```

## Seed a row between migrations

A seed is a row tagged with the migration it goes in right after, a test fixture only, never
imported by production code. Works the same for `migrations` from any source:

```ts
import type { SqlStatement } from "migration-preflight";
import { MigrationChain, renderInsert } from "migration-preflight";

// Reuses the library's own SqlStatement shape instead of a hand-rolled one, so this
// can't silently drift out of sync with what applyAll's seedsAfter callback expects.
type Seed = SqlStatement & {
  readonly table: string;
  readonly id: string;
};

// Keyed by migration tag, not idx: a tag is the migration's stable name, it doesn't shift
// when a migration is added or removed elsewhere in the history. One array per tag, so more
// than one seed can go after the same migration.
const SEEDS_BY_TAG = new Map<string, readonly Seed[]>([
  [
    "0001_add_users",
    [
      {
        table: "users",
        id: "user-1",
        sql: renderInsert("users", { id: "user-1", email: "a@b.com" }),
        params: [],
      },
    ],
  ],
  // ...one entry per migration tag you want to seed after
]);

await chain.applyAll((migration) => SEEDS_BY_TAG.get(migration.tag) ?? []);

expect(await chain.hasRow("users", "user-1")).toBe(true);
expect(await chain.foreignKeyViolations()).toEqual([]);
```

`renderInsert` hand-writes the seed SQL for clarity. A fuller setup typically types seeds off your
own model instead: Drizzle's `InferInsertModel`, Prisma's generated types, or a hand-written type
for plain SQL.

`hasRow`/`getRow` assume the primary key column is `id`, pass a third argument for a table whose PK
is named something else: `chain.hasRow("order_line_items", "li1", "order_id")`.

## Run a quick "does it apply cleanly" smoke test

Both adapters expose a `/drizzle` subpath that runs Drizzle's own migrator instead of the stepwise
replay, so it needs `drizzle-orm`:

```ts
// SQLite
import { runDrizzleBetterSqliteMigrations } from "@migration-preflight/adapters-sqlite/drizzle";

await expect(() =>
  runDrizzleBetterSqliteMigrations({ migrationsFolder: join(import.meta.dirname, "out") }),
).not.toThrow();
```

```ts
// Postgres
import { runDrizzlePgliteMigrations } from "@migration-preflight/adapters-postgres/drizzle";

await expect(
  runDrizzlePgliteMigrations({ migrationsFolder: join(import.meta.dirname, "out") }),
).resolves.toBeUndefined();
```

This catches "migration doesn't apply" but not "migration applies and silently drops data". For
that, seed a row (see above).

## Load Postgres extensions (e.g. `pg_trgm`)

If a migration runs `CREATE EXTENSION ...`, PGlite needs that extension loaded up front. Build the
client yourself and pass it in:

```ts
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const client = new PGlite({ extensions: { pg_trgm } });

await runDrizzlePgliteMigrations({ migrationsFolder, client });
await client.close();

const db = createPgliteMigrationDatabase(new PGlite({ extensions: { pg_trgm } }));
```

Neither `runDrizzlePgliteMigrations` nor `createPgliteMigrationDatabase` closes a client you
supplied yourself.

## Assert on foreign key integrity

- **SQLite**: `foreignKeyViolations()` returns the offending rows, assert `toEqual([])`.
- **Postgres**: `foreignKeyViolations()` always returns `[]`. A violation throws instead, from
  whichever `run`/`transaction` call caused it. Wrap that call in `expect(...).rejects.toThrow()`.

See [Explanation](./explanation.md#why-foreignkeyviolations-always-returns--on-postgres) for why.

## Add a custom `MigrationSource`

For any format none of the bundled sources cover (Knex, TypeORM, or anything else), write your own:

```ts
import type { Migration, MigrationSource } from "migration-preflight/sources";

const myCustomSource: MigrationSource = (migrationsDir) => {
  /* read your own format, return Migration[] in order */
};
```

## Run this repo's own tests

```sh
pnpm install
pnpm verify
```

Or scope to one package:

```sh
pnpm --filter migration-preflight test
pnpm --filter @migration-preflight/adapters-sqlite test
pnpm --filter @migration-preflight/adapters-postgres test:db
```

Known issue: running the Postgres adapter's tests alongside other heavy suites can still push CI
memory usage high, see [Explanation](./explanation.md#known-issue-pglite-memory-use-in-tests) for
why.

## Release a new version

Uses [Changesets](https://github.com/changesets/changesets). Nobody pushes to `main` directly,
including for version bumps: everything lands through a merged PR.

**1. Add a changeset, in your feature/fix PR**

```sh
pnpm changeset
```

Each merged PR carries its own changeset; they pile up on `main` until step 2 cuts a release. Commit
the generated `.changeset/*.md` file and merge the PR as usual.

**2. Cut the release PR, once changesets have piled up on `main`**

```sh
git checkout main
git checkout -b release/$(date +%Y-%m-%d)
pnpm changeset version && pnpm install
git commit -am "chore(release): version packages"
git push -u origin HEAD
gh pr create --title "chore(release): version packages" --fill
```

Copy this into the PR description, filling in the version column from the `package.json` diffs:

```markdown
## Releases

| Package                                  | Version |
| ---------------------------------------- | ------- |
| `migration-preflight`                    | 0.0.0   |
| `@migration-preflight/adapters-sqlite`   | 0.0.0   |
| `@migration-preflight/adapters-postgres` | 0.0.0   |
```

Review the diff (version bumps + `CHANGELOG.md`) and merge it like any other PR.

**3. Publish, from your machine, after that PR is merged**

```sh
git checkout main
npm login          # if you don't already have a session
pnpm release        # build, then changeset publish (also tags each bumped package)
git push --follow-tags
pnpm release:notes  # create a GitHub Release, per package, from that CHANGELOG.md entry
```

`pnpm release:notes` needs `gh` authenticated and is safe to re-run: it skips any tag that already
has a release. See
[Explanation § Why release notes are a separate, idempotent script](./explanation.md#why-release-notes-are-a-separate-idempotent-script)
for why.

One-time setup: **Settings → Branches** → require a PR before merging into `main`, so steps 1 and 2
are the only way in. (Needs the repo to be public, or GitHub Pro, for a private repo.)

See [Explanation § Versioning policy](./explanation.md#versioning-policy) for why packages version
independently rather than in lockstep.
