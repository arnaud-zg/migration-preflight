import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Migration } from "../domain/migrations/migrationChain.ports";
import type { MigrationSource } from "./migrationSource.port";

/**
 * `MigrationSource` for a flat folder of `<tag>.sql` files, sorted by
 * filename, no migration tool and no journal. Each file runs as a single
 * prepared statement unless split with Drizzle's own `--> statement-breakpoint`
 * marker, the same one `splitIntoStatements` looks for regardless of source.
 */
export const sqlFileSource: MigrationSource = (migrationsDir) =>
  readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file, idx): Migration => ({
      idx,
      tag: file.replace(/\.sql$/, ""),
      sql: readFileSync(join(migrationsDir, file), "utf8"),
    }));
