import type { MigrationDatabase, SqlRow } from "migration-preflight";
import { PGlite } from "@electric-sql/pglite";

/** What the client and a transaction handle share: the one call this adapter makes. */
type Executor = Pick<PGlite, "query">;

/**
 * A MigrationDatabase on PGlite, an in-memory WASM Postgres: no Docker, no server. Placeholders are
 * `$1`, `$2`, … and `foreignKeyViolations` is always `[]`, since Postgres rejects a violation on
 * write. Pass a `client` to load an extension (`new PGlite({ extensions: { pg_trgm } })`).
 */
export const createPgliteMigrationDatabase = (client: PGlite = new PGlite()): MigrationDatabase => {
  // Inside `transaction`, statements go to its handle, not the client, so they run in it.
  let executor: Executor = client;

  return {
    dialect: { placeholder: (index) => `$${index + 1}` },
    run: async (sql, parameters = []) => {
      await executor.query(sql, [...parameters]);
    },
    query: async (sql, parameters = []) => {
      const result = await executor.query<SqlRow>(sql, [...parameters]);
      return result.rows;
    },
    transaction: async (work) => {
      await client.transaction(async (transaction) => {
        executor = transaction;
        try {
          await work();
        } finally {
          executor = client;
        }
      });
    },
    foreignKeyViolations: () => [],
  };
};
