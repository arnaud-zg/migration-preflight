import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { sqlFileSource } from "../sqlFileSource";

const MIGRATIONS_DIR = join(import.meta.dirname, "fixtures", "sql-migrations");

describe("sqlFileSource", () => {
  const migrations = sqlFileSource(MIGRATIONS_DIR);

  it("loads migrations in filename order with contiguous indexes from 0", () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations.map((migration) => migration.idx)).toEqual(
      migrations.map((_, index) => index),
    );
  });

  it("tags each migration by filename, without the .sql extension", () => {
    expect(migrations[0]?.tag).toBe("0000_create_a");
    expect(migrations[0]?.sql).toContain("CREATE TABLE a");
  });

  it("ignores non-.sql files", () => {
    expect(migrations.some((migration) => migration.tag === "notes")).toBe(false);
  });
});
