import { readFileSync } from "node:fs";

import type { Migration } from "../migrationChain.ports";

/** Reads each tag's SQL file, numbering the migrations in the order the tags come. */
export const readMigrations = (
  tags: readonly string[],
  sqlFileOf: (tag: string) => string,
): Migration[] => tags.map((tag, idx) => ({ idx, tag, sql: readFileSync(sqlFileOf(tag), "utf8") }));
