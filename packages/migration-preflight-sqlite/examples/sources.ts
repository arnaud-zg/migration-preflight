import { join } from "node:path";
import { drizzleFileSource, prismaFileSource, sqlFileSource } from "migration-preflight/sources";

// Three layouts, one result: the same `Migration[]` that MigrationChain replays.
export const fromDrizzle = () => drizzleFileSource(join(import.meta.dirname, "drizzle"));

export const fromPrisma = () => prismaFileSource(join(import.meta.dirname, "prisma/migrations"));

export const fromSqlFiles = () => sqlFileSource(join(import.meta.dirname, "sql"));
