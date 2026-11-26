import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { createPgliteMigrationDatabase } from "@migration-preflight/postgres";
import { runDrizzlePgliteMigrations } from "@migration-preflight/postgres/drizzle";
import { MigrationChain, renderInsert } from "migration-preflight";
import { drizzleFileSource } from "migration-preflight/sources";

// The history runs `CREATE EXTENSION pg_trgm`: PGlite needs that extension loaded up front.
const migrationsFolder = join(import.meta.dirname, "drizzle");

/** Replays the history with a seed on a client that has pg_trgm, and says if the row survived. */
export const seedSurvivesWithTrigram = async (): Promise<boolean> => {
  const client = new PGlite({ extensions: { pg_trgm } });
  try {
    const chain = new MigrationChain(
      createPgliteMigrationDatabase(client),
      drizzleFileSource(migrationsFolder),
    );
    await chain.applyAll((migration) =>
      migration.tag === "0000_create_users"
        ? [{ sql: renderInsert("users", { id: "u1", email: "a@b.com" }), params: [] }]
        : [],
    );
    return await chain.hasRow("users", "u1");
  } finally {
    // Neither function closes a client you pass: close it yourself.
    await client.close();
  }
};

/** Drizzle's own migrator on the same history, with the extension loaded. */
export const applyWithDrizzle = async (): Promise<void> => {
  const client = new PGlite({ extensions: { pg_trgm } });
  try {
    await runDrizzlePgliteMigrations({ migrationsFolder, client });
  } finally {
    await client.close();
  }
};
