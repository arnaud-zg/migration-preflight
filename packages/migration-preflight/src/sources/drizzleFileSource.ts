import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Migration } from "../domain/migrations/migrationChain.ports";
import type { MigrationSource } from "./migrationSource.port";

type JournalEntry = { readonly idx: number; readonly tag: string };
type Journal = { readonly entries: readonly JournalEntry[] };

/**
 * Loads the compiled migrations from a Drizzle output directory: the journal
 * gives the order and tags, and each `<tag>.sql` file supplies the SQL. Reads
 * from disk (Node fs), so this is test/build-time only. Works unchanged for
 * any Drizzle dialect (sqlite, postgres, …) — the journal/SQL layout is the
 * same, and the `--> statement-breakpoint` marker is dialect-independent.
 */
export const loadMigrationsFromDisk = (outDir: string): Migration[] => {
  const journalPath = join(outDir, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as Journal;

  return journal.entries.map(({ idx, tag }) => ({
    idx,
    tag,
    sql: readFileSync(join(outDir, `${tag}.sql`), "utf8"),
  }));
};

/** `MigrationSource` for a Drizzle `out/` directory. */
export const drizzleFileSource: MigrationSource = loadMigrationsFromDisk;
