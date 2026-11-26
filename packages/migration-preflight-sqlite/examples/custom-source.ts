import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { MigrationSource } from "migration-preflight/sources";

const UP = ".up.sql";

/** A folder of `<tag>.up.sql` and `<tag>.down.sql` files: replays the `up` ones, in name order. */
export const upSqlFileSource: MigrationSource = (migrationsDir) =>
  readdirSync(migrationsDir)
    .filter((file) => file.endsWith(UP))
    .sort()
    .map((file, idx) => ({
      idx,
      tag: file.slice(0, -UP.length),
      sql: readFileSync(join(migrationsDir, file), "utf8"),
    }));
