[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · **🛠️ How-to** ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🛠️ How-to guides

## Pick an adapter

| You're testing | Install                                  | Zero runtime deps?                                                    |
| -------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| SQLite         | `@migration-preflight/adapters-sqlite`   | Yes, `node:sqlite` is a Node builtin                                  |
| Postgres       | `@migration-preflight/adapters-postgres` | No, pulls in [PGlite](https://pglite.dev), an in-memory WASM Postgres |

Both are dev dependencies. Install only the one matching your database.

## Seed a row between migrations

A seed is a row tagged with the migration it goes in right after, a test fixture only, never
imported by production code.

```ts
import { MigrationChain, renderInsert } from "migration-preflight";

type Seed = {
  readonly after: string; // the migration tag this seed is inserted right after
  readonly table: string;
  readonly id: string;
  readonly sql: string;
  readonly params: readonly (string | number | null)[];
};

const userSeed: Seed = {
  after: "0001_add_users",
  table: "users",
  id: "user-1",
  sql: renderInsert("users", { id: "user-1", email: "a@b.com" }),
  params: [],
};

const ALL_SEEDS: readonly Seed[] = [userSeed /* , ...one per row you want to plant */];
const seedsAfter = (tag: string) => ALL_SEEDS.filter((seed) => seed.after === tag);

await chain.applyThrough(migrations.at(-1)!.idx, (migration) => seedsAfter(migration.tag));

expect(await chain.hasRow("users", "user-1")).toBe(true);
expect(await chain.foreignKeyViolations()).toEqual([]);
```

`renderInsert` hand-writes the seed SQL for clarity. A fuller setup typically types seeds straight
off your own Drizzle model instead.

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

The core package only depends on the `MigrationSource` port
(`(migrationsDir: string) => readonly Migration[]`). Write your own for a different migration format
(e.g. Prisma's `migrations/` directory):

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
