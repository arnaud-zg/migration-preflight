import { describe, expect, it } from "vitest";

import type { Migration, MigrationDatabase, SqlRow } from "./migrationChain.ports";
import { MigrationChain } from "./migrationChain";

// In-memory fake: records the statements it runs and whether it was in a
// transaction at the time, so the domain logic can be tested without a driver.
class RecordingDatabase implements MigrationDatabase {
  readonly dialect = { placeholder: () => "?" };
  readonly ranInTransaction: string[] = [];
  readonly queriesRun: { sql: string; params: readonly unknown[] }[] = [];
  private inTransaction = false;

  run(sql: string): void {
    if (this.inTransaction) this.ranInTransaction.push(sql);
  }

  query(sql: string, params: readonly unknown[] = []): SqlRow[] {
    this.queriesRun.push({ sql, params });
    return [];
  }

  async transaction(work: () => Promise<void> | void): Promise<void> {
    this.inTransaction = true;
    await work();
    this.inTransaction = false;
  }

  foreignKeyViolations(): SqlRow[] {
    return [];
  }
}

const migration = (idx: number, sql: string): Migration => ({ idx, tag: `m${idx}`, sql });

describe("MigrationChain.applyThrough", () => {
  it("runs each migration's statements then its seeds, in order, inside a transaction", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, [
      migration(0, "CREATE TABLE a (id text);"),
      migration(1, "CREATE TABLE b (id text);"),
    ]);

    await chain.applyThrough(1, (m) =>
      m.idx === 0 ? [{ sql: "INSERT INTO a VALUES ('x')", params: [] }] : [],
    );

    expect(database.ranInTransaction).toEqual([
      "CREATE TABLE a (id text);",
      "INSERT INTO a VALUES ('x')",
      "CREATE TABLE b (id text);",
    ]);
  });

  it("stops at maxIdx", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, [
      migration(0, "CREATE TABLE a (id text);"),
      migration(1, "CREATE TABLE b (id text);"),
    ]);

    await chain.applyThrough(0, () => []);

    expect(database.ranInTransaction).toEqual(["CREATE TABLE a (id text);"]);
  });

  it("splits multi-statement migrations on the breakpoint marker", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, [
      migration(0, "CREATE TABLE a (id text);--> statement-breakpoint\nDROP TABLE a;"),
    ]);

    await chain.applyThrough(0, () => []);

    expect(database.ranInTransaction).toEqual(["CREATE TABLE a (id text);", "DROP TABLE a;"]);
  });
});

describe("MigrationChain.hasRow / getRow", () => {
  it("queries by the id column by default", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, []);

    await chain.hasRow("users", "u1");

    expect(database.queriesRun).toEqual([
      { sql: 'SELECT "id" FROM "users" WHERE "id" = ?', params: ["u1"] },
    ]);
  });

  it("queries by a caller-given primary key column, for tables whose PK isn't `id`", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, []);

    await chain.hasRow("order_line_items", "li1", "order_id");

    expect(database.queriesRun).toEqual([
      {
        sql: 'SELECT "order_id" FROM "order_line_items" WHERE "order_id" = ?',
        params: ["li1"],
      },
    ]);
  });

  it("getRow selects every column by the given id column", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, []);

    await chain.getRow("order_line_items", "li1", "order_id");

    expect(database.queriesRun).toEqual([
      { sql: 'SELECT * FROM "order_line_items" WHERE "order_id" = ?', params: ["li1"] },
    ]);
  });

  it("double-quotes the table name, so a table named after a reserved word (e.g. postgres's `user`) still resolves to the table, not the keyword", async () => {
    const database = new RecordingDatabase();
    const chain = new MigrationChain(database, []);

    await chain.hasRow("user", "u1");

    expect(database.queriesRun).toEqual([
      { sql: 'SELECT "id" FROM "user" WHERE "id" = ?', params: ["u1"] },
    ]);
  });
});
