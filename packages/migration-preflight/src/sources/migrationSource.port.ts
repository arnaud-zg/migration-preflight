import type { Migration } from "../domain/migrations/migrationChain.ports";

/**
 * Where an ordered list of migrations comes from — independent of the ORM
 * that generated them. `drizzleFileSource` is the shipped implementation;
 * this port is the seam for a future source (e.g. Prisma's `migrations/`
 * directory) once there's a real schema to test one against.
 */
export type MigrationSource = (migrationsDir: string) => readonly Migration[];
