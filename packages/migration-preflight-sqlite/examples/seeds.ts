import type { Migration, SqlStatement } from "migration-preflight";
import { createNodeSqliteMigrationDatabase } from "@migration-preflight/sqlite";
import { MigrationChain, renderInsert } from "migration-preflight";

// A seed names its table and row id, so a test can check every one of them afterwards.
export type Seed = SqlStatement & {
  readonly table: string;
  readonly id: string;
};

// Keyed by tag, not idx: a tag stays the same when another migration is added or removed.
export const SEEDS_BY_TAG = new Map<string, readonly Seed[]>([
  [
    "0000_create_users",
    [
      {
        table: "users",
        id: "user-1",
        sql: renderInsert("users", { id: "user-1", email: "a@b.com" }),
        params: [],
      },
      {
        table: "users",
        id: "user-2",
        sql: renderInsert("users", { id: "user-2", email: "c@d.com" }),
        params: [],
      },
    ],
  ],
]);

/** Replays `migrations` with every seed in place, then lists the seeds that did not survive. */
export const lostSeeds = async (migrations: readonly Migration[]): Promise<Seed[]> => {
  const chain = new MigrationChain(createNodeSqliteMigrationDatabase(), migrations);
  await chain.applyAll((migration) => SEEDS_BY_TAG.get(migration.tag) ?? []);

  const lost: Seed[] = [];
  for (const seed of [...SEEDS_BY_TAG.values()].flat()) {
    if (!(await chain.hasRow(seed.table, seed.id))) lost.push(seed);
  }
  return lost;
};
