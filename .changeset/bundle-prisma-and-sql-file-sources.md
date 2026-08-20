---
"migration-preflight": patch
---

Add `prismaFileSource` and `sqlFileSource` to `migration-preflight/sources`, bundled alongside
`drizzleFileSource`. Both were previously hand-rolled recipes in the docs; now they ship with the
package, so Prisma and plain-SQL-file migrations work the same way Drizzle's do, no custom
`MigrationSource` needed.
