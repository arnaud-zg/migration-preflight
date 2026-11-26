[🏠 Home](../README.md) · **📚 Docs**

# 📚 Documentation

migration-preflight replays your migration history against a real SQLite or Postgres database, with
rows seeded in between, so a migration that silently drops data fails a test instead of production.
Its four pages follow [Diátaxis](https://diataxis.fr/): pick the one that matches what you need
right now.

| You want to...                          | Open                                                   |
| --------------------------------------- | ------------------------------------------------------ |
| Get it working for the first time       | 🚀 [Tutorial](./migration-preflight/tutorial.md)       |
| Solve one specific task                 | 🛠️ [How-to](./migration-preflight/how-to.md)           |
| Look up a function, type or export      | 📖 [Reference](./migration-preflight/reference.md)     |
| Understand why it works the way it does | 💡 [Explanation](./migration-preflight/explanation.md) |

## 🤔 Which packages do I need?

| You test against | Install                                                 | Runtime dependencies                                     |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| SQLite           | `migration-preflight` + `@migration-preflight/sqlite`   | none: `node:sqlite` is built in                          |
| Postgres         | `migration-preflight` + `@migration-preflight/postgres` | [PGlite](https://pglite.dev), an in-memory WASM Postgres |

The core reads Drizzle, Prisma and plain SQL migration folders on its own. Every example the pages
link lives in
[`packages/migration-preflight-sqlite/examples/`](../packages/migration-preflight-sqlite/examples/preflight.ts)
or
[`packages/migration-preflight-postgres/examples/`](../packages/migration-preflight-postgres/examples/extensions.ts),
and each package's `src/examples.integration.test.ts` runs them on every `pnpm test`.

## 🤝 Contributing to this repo

[How-to](./contributing/how-to.md) (run the checks, release, publish from GitHub Actions, deprecate
a package) · [Reference](./contributing/reference.md) (layout, scripts, changeset, findability and
link rules) · [Explanation](./contributing/explanation.md) (three packages, versioning policy,
tooling choices)
