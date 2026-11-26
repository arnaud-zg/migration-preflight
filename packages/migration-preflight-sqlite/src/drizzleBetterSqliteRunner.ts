import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

/**
 * Applies every migration in `migrationsFolder` with drizzle's own better-sqlite3 migrator, the
 * `migrate()` a Node app runs, on a fresh in-memory database: "does it all apply cleanly". Behind
 * the `./drizzle` subpath, so the raw adapter never needs drizzle-orm or better-sqlite3.
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
