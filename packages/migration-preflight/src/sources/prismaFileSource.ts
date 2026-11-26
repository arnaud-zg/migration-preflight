import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { MigrationSource } from "./migrationSource.port";
import { readMigrations } from "./readMigrations";

/**
 * `MigrationSource` for a Prisma `prisma/migrations/` directory: each `<timestamp>_<name>/` folder
 * holds a `migration.sql`, and the folder names sort into the right order.
 */
export const prismaFileSource: MigrationSource = (migrationsDir) => {
  const tags = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return readMigrations(tags, (tag) => join(migrationsDir, tag, "migration.sql"));
};
