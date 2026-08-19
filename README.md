# migration-preflight

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="migration-preflight logo" />
</p>

Test your database migrations before you ship them, not after they've already run on real data.

## 🐛 The problem

A migration can drop and recreate a table, or rename a column by dropping the old one. It applies
cleanly, no error, and still destroys every row that was in it. An empty local database never
catches that: there's nothing in it to lose.

## 🌱 The idea

Plant a row before the migration, run it, and check the row survived. That's the difference between
"it didn't crash" and "my data is safe."

```mermaid
flowchart LR
    M1[Migration 1] --> S["🌱 seed a row"] --> M2[Migration 2] --> M3[...] --> MN[Migration N]
    MN --> Check{Row still there?<br/>Foreign keys still valid?}
    Check -->|No| Bug[🔴 caught here, before it ships]
    Check -->|Yes| Safe[✅ safe to ship]
```

One test run replays your migration history and tells you exactly which step, if any, would have
broken something.

## ⚡ Quick start

```sh
pnpm add -D migration-preflight @migration-preflight/adapters-sqlite
```

```ts
import { createNodeSqliteMigrationDatabase } from "@migration-preflight/adapters-sqlite"; // or -postgres
import { MigrationChain } from "migration-preflight";
import { drizzleFileSource } from "migration-preflight/sources";

const migrations = drizzleFileSource(join(import.meta.dirname, "out"));
const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);

await chain.applyThrough(migrations.at(-1)!.idx, () => []);
```

See the [Tutorial](./docs/tutorial.md) to add the seed step and prove it survives a migration.

## 📦 Packages

| Package                                                                                      | What it's for                 |
| -------------------------------------------------------------------------------------------- | ----------------------------- |
| [`migration-preflight`](./packages/migration-preflight)                                      | Core: replay engine, ports    |
| [`@migration-preflight/adapters-sqlite`](./packages/migration-preflight-adapters-sqlite)     | SQLite driver (`node:sqlite`) |
| [`@migration-preflight/adapters-postgres`](./packages/migration-preflight-adapters-postgres) | Postgres driver (PGlite)      |

No database driver or ORM dependency in the core. Add only the adapter you actually test against.

## 📚 Documentation

- 🚀 **[Tutorial](./docs/tutorial.md)**: seed a row, run a migration, prove it survives.
- 🛠️ **[How-to guides](./docs/how-to.md)**: task recipes.
- 📖 **[Reference](./docs/reference.md)**: API and package layout.
- 💡 **[Explanation](./docs/explanation.md)**: design rationale.

## 🤝 Contributing

```sh
pnpm install
pnpm verify
```

Released independently per package with [Changesets](https://github.com/changesets/changesets); see
[How-to § Release a new version](./docs/how-to.md#release-a-new-version).

## License

MIT
