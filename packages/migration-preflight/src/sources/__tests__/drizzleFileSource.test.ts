import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadMigrationsFromDisk } from "../drizzleFileSource";

const OUT_DIR = join(import.meta.dirname, "fixtures", "out");

describe("drizzleFileSource", () => {
  const migrations = loadMigrationsFromDisk(OUT_DIR);

  it("loads migrations in journal order with contiguous indexes from 0", () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations.map((migration) => migration.idx)).toEqual(
      migrations.map((_, index) => index),
    );
  });

  it("reads each migration's SQL", () => {
    expect(migrations[0]?.tag).toBe("0000_create_a");
    expect(migrations[0]?.sql).toContain("CREATE TABLE");
  });
});
