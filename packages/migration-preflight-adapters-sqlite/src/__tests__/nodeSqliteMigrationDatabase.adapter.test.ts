import { describe, expect, it } from "vitest";

import { createNodeSqliteMigrationDatabase } from "../nodeSqliteMigrationDatabase.adapter";

describe("nodeSqliteMigrationDatabase adapter", () => {
  it("runs statements and queries rows", async () => {
    const db = createNodeSqliteMigrationDatabase();
    await db.run("CREATE TABLE t (id text)");
    await db.run("INSERT INTO t (id) VALUES ('x')");
    expect(await db.query("SELECT id FROM t WHERE id = ?", ["x"])).toEqual([{ id: "x" }]);
  });

  it("rolls back the transaction when work throws", async () => {
    const db = createNodeSqliteMigrationDatabase();
    await db.run("CREATE TABLE t (id text)");

    await expect(
      db.transaction(async () => {
        await db.run("INSERT INTO t (id) VALUES ('x')");
        await db.run("INSERT INTO t (nope) VALUES ('y')"); // invalid column -> throws
      }),
    ).rejects.toThrow();

    expect(await db.query("SELECT id FROM t")).toEqual([]);
  });

  it("enforces foreign keys", async () => {
    const db = createNodeSqliteMigrationDatabase();
    await db.run("CREATE TABLE parent (id text PRIMARY KEY)");
    await db.run("CREATE TABLE child (id text, parent_id text REFERENCES parent(id))");
    expect(() => db.run("INSERT INTO child (id, parent_id) VALUES ('c', 'missing')")).toThrow();
  });

  it("reports foreign key violations via PRAGMA foreign_key_check", async () => {
    const db = createNodeSqliteMigrationDatabase();
    await db.run("PRAGMA foreign_keys = OFF"); // allow creating a violation to detect
    await db.run("CREATE TABLE parent (id text PRIMARY KEY)");
    await db.run("CREATE TABLE child (id text, parent_id text REFERENCES parent(id))");
    await db.run("INSERT INTO child (id, parent_id) VALUES ('c', 'missing')");

    expect(await db.foreignKeyViolations()).not.toEqual([]);
  });

  it("renders the sqlite '?' placeholder", () => {
    const db = createNodeSqliteMigrationDatabase();
    expect(db.dialect.placeholder(0)).toBe("?");
    expect(db.dialect.placeholder(3)).toBe("?");
  });
});
