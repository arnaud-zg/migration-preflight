import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Migration } from "../domain/migrations/migrationChain.ports";
import type { MigrationSource } from "./migrationSource.port";

/**
 * `MigrationSource` for a Prisma `prisma/migrations/` directory: each
 * `<timestamp>_<name>/migration.sql` folder already sorts into the right
 * order as a plain string, so there's no journal to parse.
 */
export const prismaFileSource: MigrationSource = (migrationsDir) =>
  readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((tag, idx): Migration => ({
      idx,
      tag,
      sql: readFileSync(join(migrationsDir, tag, "migration.sql"), "utf8"),
    }));
