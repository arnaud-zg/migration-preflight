import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Migration } from "../migrationChain.ports";
import type { MigrationSource } from "./migrationSource.port";

type JournalEntry = { readonly idx: number; readonly tag: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isJournalEntry = (value: unknown): value is JournalEntry =>
  isRecord(value) && typeof value.idx === "number" && typeof value.tag === "string";

const readJournal = (journalPath: string): readonly JournalEntry[] => {
  const journal: unknown = JSON.parse(readFileSync(journalPath, "utf8"));
  const entries = isRecord(journal) ? journal.entries : undefined;
  if (Array.isArray(entries) && entries.every(isJournalEntry)) return entries;
  throw new Error(`${journalPath} is not a drizzle journal: expected entries of { idx, tag }`);
};

/**
 * Loads the migrations of a Drizzle `out/` directory: `meta/_journal.json` gives the order and tags,
 * each `<tag>.sql` the SQL. The layout is the same for every Drizzle dialect.
 */
export const loadMigrationsFromDisk = (outDir: string): Migration[] =>
  readJournal(join(outDir, "meta", "_journal.json")).map(({ idx, tag }) => ({
    idx,
    tag,
    sql: readFileSync(join(outDir, `${tag}.sql`), "utf8"),
  }));

/** `MigrationSource` for a Drizzle `out/` directory. */
export const drizzleFileSource: MigrationSource = loadMigrationsFromDisk;
