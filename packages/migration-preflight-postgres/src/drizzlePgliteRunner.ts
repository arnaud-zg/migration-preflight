import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

/**
 * Applies every migration in `migrationsFolder` through drizzle's own PGlite
 * migrator, against a fresh in-memory Postgres instance — mirroring the same
 * `migrate()` call a Postgres-backed app runs in production via
 * drizzle-orm/postgres-js/migrator. Complements the raw
 * `createPgliteMigrationDatabase` adapter, which replays statements one at a
 * time for seed-survival / FK / data-transformation assertions; this runner
 * instead answers "do all migrations apply cleanly through the real
 * migrator", so it needs drizzle-orm (kept behind this "./drizzle" subpath —
 * importing the raw adapter never requires it).
 *
 * Pass `client` when migrations need a Postgres extension PGlite doesn't
 * enable by default (e.g. `CREATE EXTENSION pg_trgm` needs
 * `new PGlite({ extensions: { pg_trgm } })` from `@electric-sql/pglite/contrib/pg_trgm`).
 * Without one, a bare in-memory PGlite is created and closed for you.
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
