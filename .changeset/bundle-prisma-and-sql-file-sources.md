---
"migration-preflight": patch
---

Test Prisma and plain SQL migrations the same way you already test Drizzle's, no custom code
required.

Until now, only Drizzle had a ready-made `MigrationSource`: testing a Prisma or hand-written SQL
migration history meant writing and maintaining that reader yourself. `prismaFileSource` and
`sqlFileSource` ship with the core package now, alongside `drizzleFileSource`, so seeding a row and
replaying your migration history works the same way regardless of which tool wrote it, or whether
you use one at all.

- `prismaFileSource`: reads a Prisma `prisma/migrations/` directory directly, no journal file needed
- `sqlFileSource`: reads a flat folder of numbered `.sql` files, for projects with no migration tool

Both are importable from `migration-preflight/sources`, same as `drizzleFileSource`.
