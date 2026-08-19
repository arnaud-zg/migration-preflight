import type { MigrationDatabase, SqlRow, SqlValue } from "migration-preflight";
import { PGlite } from "@electric-sql/pglite";

/** The subset of PGlite's API shared by the top-level client and a transaction handle. */
type Executor = {
  query: <T = SqlRow>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
};

/**
 * A MigrationDatabase backed by PGlite — an in-memory WASM Postgres, so tests
 * need no Docker / external server. Runs migrations through the same
 * MigrationChain stepwise replay as the SQLite adapter, but:
 *   • dialect.placeholder renders "$1", "$2", … (Postgres bound parameters).
 *   • foreignKeyViolations always returns [] — Postgres enforces foreign keys
 *     immediately at write time, so a violation surfaces as a thrown error
 *     from run()/transaction() rather than a deferred check query.
 *
 * `run`/`query` are routed through whichever executor (the client or an
 * active transaction handle) is current, so statements issued while inside
 * `transaction()` actually run on that transaction instead of racing it.
 *
 * Pass `client` when migrations need a Postgres extension PGlite doesn't
 * enable by default (e.g. `CREATE EXTENSION pg_trgm` needs
 * `new PGlite({ extensions: { pg_trgm } })` from `@electric-sql/pglite/contrib/pg_trgm`).
 * Without one, a bare in-memory PGlite is created for you.
 */
export const createPgliteMigrationDatabase = (client: PGlite = new PGlite()): MigrationDatabase => {
  let executor: Executor = client;

  const toParams = (parameters: readonly SqlValue[]): unknown[] => [...parameters];

  return {
    dialect: { placeholder: (index) => `$${index + 1}` },
    run: async (sql, parameters = []) => {
      await executor.query(sql, toParams(parameters));
    },
    query: async (sql, parameters = []) => {
      const result = await executor.query<SqlRow>(sql, toParams(parameters));
      return result.rows;
    },
    transaction: async (work) => {
      await client.transaction(async (tx) => {
        executor = tx;
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
