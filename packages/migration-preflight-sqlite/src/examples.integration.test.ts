import { join } from "node:path";
import { MigrationChain } from "migration-preflight";
import { describe, expect, it } from "vitest";

import { upSqlFileSource } from "../examples/custom-source";
import { replayWithSeed } from "../examples/preflight";
import { lostSeeds } from "../examples/seeds";
import { applyWithDrizzle } from "../examples/smoke";
import { fromDrizzle, fromPrisma, fromSqlFiles } from "../examples/sources";
import { createNodeSqliteMigrationDatabase } from "./index";

// The docs link these files, so each one runs here as a project would run it.
const examples = join(import.meta.dirname, "..", "examples");

describe("the examples the docs show", () => {
  it("preflight: the seeded user survives drizzle/0000_create_users then drizzle/0001_add_users_bio", async () => {
    const chain = await replayWithSeed(join(examples, "drizzle"));

    expect(await chain.hasRow("users", "u1")).toBe(true);
    expect(await chain.getRow("users", "u1")).toEqual({ id: "u1", email: "a@b.com", bio: null });
    expect(await chain.foreignKeyViolations()).toEqual([]);
  });

  it("preflight: the seeded user is gone after drizzle-drops-users/0001_rebuild_users", async () => {
    const chain = await replayWithSeed(join(examples, "drizzle-drops-users"));

    expect(await chain.hasRow("users", "u1")).toBe(false);
  });

  it("sources: Drizzle, Prisma and plain SQL folders give the same migrations, in order", () => {
    expect(fromDrizzle().map(({ tag }) => tag)).toEqual([
      "0000_create_users",
      "0001_add_users_bio",
    ]);
    expect(fromPrisma().map(({ tag }) => tag)).toEqual([
      "20240101000000_create_users",
      "20240102000000_add_users_bio",
    ]);
    expect(fromSqlFiles().map(({ tag }) => tag)).toEqual([
      "0000_create_users",
      "0001_add_users_bio",
    ]);
  });

  it("seeds: every seed survives the Drizzle history", async () => {
    expect(await lostSeeds(fromDrizzle())).toEqual([]);
  });

  it("sources: sql/0001_add_users_bio, split with a breakpoint, runs both its statements", async () => {
    const database = createNodeSqliteMigrationDatabase();

    await new MigrationChain(database, fromSqlFiles()).applyAll();

    expect(
      await database.query("SELECT name FROM sqlite_master WHERE name = 'users_email_idx'"),
    ).toEqual([{ name: "users_email_idx" }]);
  });

  it("seeds: every seed survives the plain SQL history", async () => {
    expect(await lostSeeds(fromSqlFiles())).toEqual([]);
  });

  it("seeds: a seed keyed by a tag the history lacks is never planted, so it reads as lost", async () => {
    expect(await lostSeeds(fromPrisma())).toHaveLength(2);
  });

  it("custom-source: replays only the .up.sql files, in name order", () => {
    const migrations = upSqlFileSource(join(examples, "up-sql"));

    expect(migrations.map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 0, tag: "0000_create_users" },
      { idx: 1, tag: "0001_add_users_bio" },
    ]);
  });

  it("smoke: Drizzle's own migrator applies the example history", () => {
    expect(applyWithDrizzle).not.toThrow();
  });
});
