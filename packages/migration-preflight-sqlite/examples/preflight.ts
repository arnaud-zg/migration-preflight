import type { SqlStatement } from "migration-preflight";
import { createNodeSqliteMigrationDatabase } from "@migration-preflight/sqlite";
import { MigrationChain, renderInsert } from "migration-preflight";
import { drizzleFileSource } from "migration-preflight/sources";

// One users row, planted right after the migration that creates the table.
const seedsByTag = new Map<string, readonly SqlStatement[]>([
  [
    "0000_create_users",
    [{ sql: renderInsert("users", { id: "u1", email: "a@b.com" }), params: [] }],
  ],
]);

/** Replays a Drizzle `out/` folder on SQLite, with the seed in place, ready for assertions. */
export const replayWithSeed = async (migrationsFolder: string): Promise<MigrationChain> => {
  const chain = new MigrationChain(
    createNodeSqliteMigrationDatabase(),
    drizzleFileSource(migrationsFolder),
  );
  await chain.applyAll((migration) => seedsByTag.get(migration.tag) ?? []);
  return chain;
};
