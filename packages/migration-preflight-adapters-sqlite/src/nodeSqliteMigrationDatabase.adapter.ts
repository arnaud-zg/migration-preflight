import type { MigrationDatabase } from "migration-preflight";
import { DatabaseSync } from "node:sqlite";

/**
 * A MigrationDatabase backed by node:sqlite, configured to match how an on-device SQLite
 * driver such as expo-sqlite typically runs, so migration behaviour is faithful:
 *   • enableForeignKeyConstraints — mirrors an app running with PRAGMA foreign_keys = ON,
 *     which can't be turned off from inside the migrator's own transaction.
 *   • enableDoubleQuotedStringLiterals — some SQLite builds on device allow SQLite's
 *     legacy double-quoted string literals (some generated migrations rely on it).
 *
 * This is test-only infrastructure. Zero runtime dependencies.
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
      database.prepare("BEGIN").run();
      try {
        await work();
        database.prepare("COMMIT").run();
      } catch (error) {
        database.prepare("ROLLBACK").run();
        throw error;
      }
    },
    foreignKeyViolations: () => database.prepare("PRAGMA foreign_key_check").all(),
  };
};
