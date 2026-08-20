# 🚀 migration-preflight

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="migration-preflight logo" />
</p>

<div align="center">
  <b>Test your database migrations before you ship them, not after they've already run on real data.</b>
</div>

---

<div align="center">

<!-- Badges -->

<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
<a href="https://pnpm.io/"><img src="https://img.shields.io/badge/Powered%20by-pnpm%20workspaces-F69220?logo=pnpm&logoColor=white" alt="Powered by pnpm workspaces"></a>
<img src="https://img.shields.io/badge/ESM-Ready-green" alt="ESM Ready">
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript"></a>
<a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node >=22"></a>
<img src="https://img.shields.io/badge/core-zero%20deps-brightgreen" alt="Zero runtime deps in the core">
<br/>
<a href="https://www.npmjs.com/package/migration-preflight"><img src="https://img.shields.io/npm/v/migration-preflight.svg?label=migration-preflight" alt="migration-preflight npm version"></a>
<a href="https://www.npmjs.com/package/@migration-preflight/adapters-sqlite"><img src="https://img.shields.io/npm/v/@migration-preflight/adapters-sqlite.svg?label=adapters-sqlite" alt="adapters-sqlite npm version"></a>
<a href="https://www.npmjs.com/package/@migration-preflight/adapters-postgres"><img src="https://img.shields.io/npm/v/@migration-preflight/adapters-postgres.svg?label=adapters-postgres" alt="adapters-postgres npm version"></a>

</div>

---

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
import { MigrationChain, renderInsert } from "migration-preflight";
import { drizzleFileSource } from "migration-preflight/sources"; // or prismaFileSource, sqlFileSource

const migrations = drizzleFileSource(join(import.meta.dirname, "out"));
const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);

// Seed a row before the risky migration, then check it survives every later one
await chain.applyThrough(migrations.at(-1)!.idx, (migration) =>
  migration.tag === "0000_create_users"
    ? [{ sql: renderInsert("users", { id: "u1", email: "a@b.com" }), params: [] }]
    : [],
);

await chain.hasRow("users", "u1"); // true, the row survived the whole history
```

See the [Tutorial](./docs/tutorial.md) to walk through this step by step.

## 📦 Packages

| Package                                                                                      | What it's for                 |
| -------------------------------------------------------------------------------------------- | ----------------------------- |
| [`migration-preflight`](./packages/migration-preflight)                                      | Core: replay engine, ports    |
| [`@migration-preflight/adapters-sqlite`](./packages/migration-preflight-adapters-sqlite)     | SQLite driver (`node:sqlite`) |
| [`@migration-preflight/adapters-postgres`](./packages/migration-preflight-adapters-postgres) | Postgres driver (PGlite)      |

No database driver or ORM dependency in the core. Add only the adapter you actually test against.
Ships with Drizzle, Prisma, and plain-SQL-file sources; anything else plugs in through a custom
`MigrationSource`, see
[How-to § Add a custom `MigrationSource`](./docs/how-to.md#add-a-custom-migrationsource).

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
