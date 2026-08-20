import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { prismaFileSource } from "../prismaFileSource";

const MIGRATIONS_DIR = join(import.meta.dirname, "fixtures", "prisma-migrations");

describe("prismaFileSource", () => {
  const migrations = prismaFileSource(MIGRATIONS_DIR);

  it("loads migrations in folder-name order with contiguous indexes from 0", () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations.map((migration) => migration.idx)).toEqual(
      migrations.map((_, index) => index),
    );
  });

  it("tags each migration by its folder name and reads migration.sql", () => {
    expect(migrations[0]?.tag).toBe("20240101000000_create_a");
    expect(migrations[0]?.sql).toContain("CREATE TABLE a");
  });
});
