import type { Migration } from "../domain/migrations/migrationChain.ports";

/**
 * Where an ordered list of migrations comes from, independent of the ORM
 * that generated them. `drizzleFileSource`, `prismaFileSource`, and
 * `sqlFileSource` are the shipped implementations; this port is the seam for
 * anything else (Knex, TypeORM, a custom format).
 */
export type MigrationSource = (migrationsDir: string) => readonly Migration[];
