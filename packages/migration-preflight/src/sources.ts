// A separate entry point from the package root: reading migrations off disk
// needs node:fs / node:path, which the pure domain layer (MigrationChain,
// the ports, migrationSql) does not. Importing "migration-preflight" alone
// never pulls these in, only "migration-preflight/sources" does.
export { drizzleFileSource, loadMigrationsFromDisk } from "./sources/drizzleFileSource";
export type { MigrationSource } from "./sources/migrationSource.port";
