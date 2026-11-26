import { join } from "node:path";
import { runDrizzleBetterSqliteMigrations } from "@migration-preflight/sqlite/drizzle";

/** Drizzle's own migrator on a fresh database: throws when a migration does not apply. */
export const applyWithDrizzle = (): void => {
  runDrizzleBetterSqliteMigrations({ migrationsFolder: join(import.meta.dirname, "drizzle") });
};
