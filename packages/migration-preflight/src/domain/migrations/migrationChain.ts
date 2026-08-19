import type { Migration, MigrationDatabase, SqlRow, SqlStatement } from "./migrationChain.ports";
import { splitIntoStatements } from "./migrationSql";

/**
 * Applies an ordered list of migrations to a database the same way an
 * on-device SQLite migrator does: every migration inside a single transaction, one
 * prepared statement per breakpoint chunk. Seed rows can be inserted after each
 * migration to exercise the "upgrade with existing data" path.
 *
 * Async throughout so the same chain can drive a synchronous driver
 * (node:sqlite) or an async-only one (PGlite) — see MigrationDatabase.
 */
export class MigrationChain {
  constructor(
    private readonly database: MigrationDatabase,
    private readonly migrations: readonly Migration[],
  ) {}

  /** The migrations in journal order — e.g. to drive one test case per migration. */
  ordered(): readonly Migration[] {
    return this.migrations;
  }

  /** Applies migrations up to and including `maxIdx`, seeding after each one. */
  async applyThrough(
    maxIdx: number,
    seedsAfter: (migration: Migration) => readonly SqlStatement[],
  ): Promise<void> {
    await this.database.transaction(async () => {
      for (const migration of this.migrations) {
        if (migration.idx > maxIdx) break;
        for (const statement of splitIntoStatements(migration.sql)) {
          await this.database.run(statement);
        }
        for (const seed of seedsAfter(migration)) await this.database.run(seed.sql, seed.params);
      }
    });
  }

  /**
   * Whether a row with the given id exists in the table. `idColumn` defaults
   * to `"id"` — pass the real primary key name for a table whose PK is
   * called something else (e.g. a denormalized projection keyed by its
   * parent's id, like `order_id`).
   */
  async hasRow(table: string, id: string, idColumn = "id"): Promise<boolean> {
    const placeholder = this.database.dialect.placeholder(0);
    const rows = await this.database.query(
      `SELECT "${idColumn}" FROM "${table}" WHERE "${idColumn}" = ${placeholder}`,
      [id],
    );
    return rows.length > 0;
  }

  /**
   * The full row with the given id, or undefined — for asserting a migration
   * transformed columns correctly. `idColumn` defaults to `"id"`, same as
   * `hasRow`.
   */
  async getRow(table: string, id: string, idColumn = "id"): Promise<SqlRow | undefined> {
    const placeholder = this.database.dialect.placeholder(0);
    const rows = await this.database.query(
      `SELECT * FROM "${table}" WHERE "${idColumn}" = ${placeholder}`,
      [id],
    );
    return rows[0];
  }

  /** Rows that violate a foreign key (empty when integrity holds, or when the dialect enforces FKs immediately). */
  async foreignKeyViolations(): Promise<SqlRow[]> {
    return this.database.foreignKeyViolations();
  }
}
