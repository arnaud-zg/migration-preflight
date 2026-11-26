import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

  it.each([
    ["no entries", "{}"],
    ["entries that are not a list", '{ "entries": {} }'],
    ["an entry without a tag", '{ "entries": [{ "idx": 0 }] }'],
    ["an entry without an idx", '{ "entries": [{ "tag": "0000_a" }] }'],
    ["a good entry beside a bad one", '{ "entries": [{ "idx": 0, "tag": "a" }, null] }'],
    ["null", "null"],
  ])("names the journal file when it has %s", (_, journal) => {
    const outDir = mkdtempSync(join(tmpdir(), "drizzle-out-"));
    mkdirSync(join(outDir, "meta"));
    writeFileSync(join(outDir, "meta", "_journal.json"), journal);

    expect(() => loadMigrationsFromDisk(outDir)).toThrow(/_journal\.json is not a drizzle journal/);
  });
});
