import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { MigrationSource } from "./migrationSource.port";
import { readMigrations } from "./readMigrations";

const SQL_EXTENSION = ".sql";

/**
 * `MigrationSource` for a flat folder of `<tag>.sql` files, in filename order. A file runs as one
 * statement unless split with `--> statement-breakpoint`.
 */
export const sqlFileSource: MigrationSource = (migrationsDir) => {
  const tags = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(SQL_EXTENSION))
    .sort()
    .map((file) => file.slice(0, -SQL_EXTENSION.length));
  return readMigrations(tags, (tag) => join(migrationsDir, `${tag}${SQL_EXTENSION}`));
};
