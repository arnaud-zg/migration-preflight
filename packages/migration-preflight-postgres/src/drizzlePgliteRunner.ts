import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

/**
 * Applies every migration in `migrationsFolder` with drizzle's own PGlite migrator on a fresh
 * in-memory Postgres: "does it all apply cleanly". Behind the `./drizzle` subpath, so the raw
 * adapter never needs drizzle-orm. Pass a `client` to load an extension; one you pass stays open,
 * one created here is closed.
 */
export const runDrizzlePgliteMigrations = async ({
  migrationsFolder,
  client,
}: {
  readonly migrationsFolder: string;
  readonly client?: PGlite;
}): Promise<void> => {
  const ownsClient = client === undefined;
  const pglite = client ?? new PGlite();
  try {
    await migrate(drizzle(pglite), { migrationsFolder });
  } finally {
    if (ownsClient) await pglite.close();
  }
};
