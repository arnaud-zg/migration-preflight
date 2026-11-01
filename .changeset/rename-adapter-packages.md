---
"@migration-preflight/sqlite": minor
"@migration-preflight/postgres": minor
---

Rename `@migration-preflight/adapters-sqlite` to `@migration-preflight/sqlite` and
`@migration-preflight/adapters-postgres` to `@migration-preflight/postgres`. Same API and same
`./drizzle` subpath: replace the package name in your install command and imports. The old names are
deprecated on npm.
