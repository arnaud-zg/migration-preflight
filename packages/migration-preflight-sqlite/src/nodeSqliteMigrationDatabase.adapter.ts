import type { MigrationDatabase } from "migration-preflight";
import { DatabaseSync } from "node:sqlite";

/**
 * A MigrationDatabase on an in-memory node:sqlite database, set up like an on-device SQLite driver
 * (expo-sqlite): foreign keys on, and double-quoted string literals allowed, which some generated
 * migrations rely on. Test-only, zero runtime dependencies.
 */
export const createNodeSqliteMigrationDatabase = (): MigrationDatabase => {
  const database = new DatabaseSync(":memory:", {
    enableForeignKeyConstraints: true,
    enableDoubleQuotedStringLiterals: true,
  });

  return {
    dialect: { placeholder: () => "?" },
    run: (sql, parameters = []) => {
      database.prepare(sql).run(...parameters);
    },
    query: (sql, parameters = []) => database.prepare(sql).all(...parameters),
    transaction: async (work) => {
      database.exec("BEGIN");
      try {
        await work();
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
    foreignKeyViolations: () => database.prepare("PRAGMA foreign_key_check").all(),
  };
};
