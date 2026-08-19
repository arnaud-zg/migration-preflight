import { MigrationChain } from "migration-preflight";
import { describe, expect, it } from "vitest";

import { createPgliteMigrationDatabase } from "../pgliteMigrationDatabase.adapter";
import { resetSchema, sharedClient } from "./pgliteTestClient";

describe("pgliteMigrationDatabase adapter", () => {
  it("accepts a caller-supplied client (e.g. one with extensions loaded)", async () => {
    await resetSchema();
    const db = createPgliteMigrationDatabase(sharedClient);

    await db.run("CREATE TABLE t (id text)");
    await db.run("CREATE EXTENSION IF NOT EXISTS pg_trgm"); // would throw if not preloaded
    expect(await db.query("SELECT id FROM t")).toEqual([]);
  });

  it("runs statements and queries rows", async () => {
    await resetSchema();
    const db = createPgliteMigrationDatabase(sharedClient);
    await db.run("CREATE TABLE t (id text)");
    await db.run("INSERT INTO t (id) VALUES ('x')");
    expect(await db.query("SELECT id FROM t WHERE id = $1", ["x"])).toEqual([{ id: "x" }]);
  });

  it("rolls back the transaction when work throws", async () => {
    await resetSchema();
    const db = createPgliteMigrationDatabase(sharedClient);
    await db.run("CREATE TABLE t (id text)");

    await expect(
      db.transaction(async () => {
        await db.run("INSERT INTO t (id) VALUES ('x')");
        await db.run("INSERT INTO nope (id) VALUES ('y')"); // unknown table -> throws
      }),
    ).rejects.toThrow();

    expect(await db.query("SELECT id FROM t")).toEqual([]);
  });

  it("enforces foreign keys immediately, unlike SQLite's deferred check", async () => {
    await resetSchema();
    const db = createPgliteMigrationDatabase(sharedClient);
    await db.run("CREATE TABLE parent (id text PRIMARY KEY)");
    await db.run("CREATE TABLE child (id text, parent_id text REFERENCES parent(id))");

    await expect(
      db.run("INSERT INTO child (id, parent_id) VALUES ($1, $2)", ["c", "missing"]),
    ).rejects.toThrow();

    // No deferred-check query exists for Postgres — the violation above already
    // threw, so this always reports empty.
    expect(await db.foreignKeyViolations()).toEqual([]);
  });

  it("renders the postgres '$n' placeholder", () => {
    const db = createPgliteMigrationDatabase(sharedClient);
    expect(db.dialect.placeholder(0)).toBe("$1");
    expect(db.dialect.placeholder(3)).toBe("$4");
  });

  it("drives a MigrationChain: applies migrations and interleaves seeds", async () => {
    await resetSchema();
    const db = createPgliteMigrationDatabase(sharedClient);
    const chain = new MigrationChain(db, [
      { idx: 0, tag: "0000_create_parent", sql: "CREATE TABLE parent (id text PRIMARY KEY);" },
      {
        idx: 1,
        tag: "0001_create_child",
        sql: "CREATE TABLE child (id text PRIMARY KEY, parent_id text REFERENCES parent(id));",
      },
    ]);

    await chain.applyThrough(1, (migration) =>
      migration.tag === "0000_create_parent"
        ? [{ sql: "INSERT INTO parent (id) VALUES ($1)", params: ["p1"] }]
        : [{ sql: "INSERT INTO child (id, parent_id) VALUES ($1, $2)", params: ["c1", "p1"] }],
    );

    expect(await chain.hasRow("parent", "p1")).toBe(true);
    expect(await chain.hasRow("child", "c1")).toBe(true);
    expect(await chain.foreignKeyViolations()).toEqual([]);
  });
});
