import type { Migration, MigrationDatabase, SqlRow, SqlStatement } from "./migrationChain.ports";
import { splitIntoStatements } from "./migrationSql";

type SeedsAfter = (migration: Migration) => readonly SqlStatement[];

const seedNothing: SeedsAfter = () => [];

/** Double-quotes an identifier, so a reserved word (Postgres's `user`) or a quote in it stays a name. */
const quoteIdentifier = (name: string): string => `"${name.replaceAll('"', '""')}"`;

/**
 * Applies migrations in order, as a stepwise migrator does: all of them in one transaction, one
 * statement per breakpoint chunk, with optional seed rows after each migration to prove existing
 * data survives the rest of the history.
 */
export class MigrationChain {
  constructor(
    private readonly database: MigrationDatabase,
    private readonly migrations: readonly Migration[],
  ) {}

  /** The migrations in journal order, e.g. to drive one test case per migration. */
  ordered(): readonly Migration[] {
    return this.migrations;
  }

  /** Applies migrations up to and including `maxIdx`, seeding after each one. */
  async applyThrough(maxIdx: number, seedsAfter: SeedsAfter): Promise<void> {
    await this.database.transaction(async () => {
      for (const migration of this.migrations) {
        if (migration.idx > maxIdx) return;
        await this.apply(migration, seedsAfter(migration));
      }
    });
  }

  /** Applies the whole history, seeding after each one. A no-op on an empty history. */
  async applyAll(seedsAfter: SeedsAfter = seedNothing): Promise<void> {
    await this.applyThrough(this.migrations.at(-1)?.idx ?? -1, seedsAfter);
  }

  /** Whether a row with the given id exists. `idColumn` defaults to `"id"`. */
  async hasRow(table: string, id: string, idColumn = "id"): Promise<boolean> {
    return (await this.getRow(table, id, idColumn)) !== undefined;
  }

  /** The full row with the given id, or undefined. `idColumn` defaults to `"id"`. */
  async getRow(table: string, id: string, idColumn = "id"): Promise<SqlRow | undefined> {
    const column = quoteIdentifier(idColumn);
    const placeholder = this.database.dialect.placeholder(0);
    const rows = await this.database.query(
      `SELECT * FROM ${quoteIdentifier(table)} WHERE ${column} = ${placeholder}`,
      [id],
    );
    return rows[0];
  }

  /** Rows that violate a foreign key: empty when integrity holds, or on a dialect that checks on write. */
  async foreignKeyViolations(): Promise<SqlRow[]> {
    return this.database.foreignKeyViolations();
  }

  private async apply(migration: Migration, seeds: readonly SqlStatement[]): Promise<void> {
    for (const statement of splitIntoStatements(migration.sql)) await this.database.run(statement);
    for (const seed of seeds) await this.database.run(seed.sql, seed.params);
  }
}
