import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

/**
 * Applies every migration in `migrationsFolder` through drizzle's own
 * better-sqlite3 migrator, against a fresh in-memory database — the same
 * `migrate()` call a Node app runs in production. Complements the raw
 * `createNodeSqliteMigrationDatabase` adapter, which replays statements one
 * at a time for seed-survival / FK / data-transformation assertions; this
 * runner instead answers "do all migrations apply cleanly through the real
 * migrator", so it needs drizzle-orm and better-sqlite3 (kept behind this
 * "./drizzle" subpath — importing the raw adapter never requires them).
 */
export const runDrizzleBetterSqliteMigrations = ({
  migrationsFolder,
}: {
  readonly migrationsFolder: string;
}): void => {
  const client = new Database(":memory:");
  try {
    migrate(drizzle(client), { migrationsFolder });
  } finally {
    client.close();
  }
};
