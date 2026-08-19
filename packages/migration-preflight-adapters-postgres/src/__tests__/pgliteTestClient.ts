import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

// Postgres's own defaults (128MB shared_buffers, 4MB work_mem, 100 max_connections) size for a
// real multi-client server. This is a single-connection, throwaway test database — turning them
// down trims PGlite's WASM memory footprint without touching anything the tests actually exercise.
const MINIMAL_MEMORY_POSTGRESQL_CONF = "shared_buffers=4MB\nwork_mem=1MB\nmax_connections=5";

export const sharedClient = new PGlite({
  extensions: { pg_trgm },
  postgresqlconf: MINIMAL_MEMORY_POSTGRESQL_CONF,
});

// Pays PGlite's WASM boot cost here, during module import, instead of inside whichever test
// happens to touch the client first. Vitest's testTimeout only wraps a test body's own execution,
// not the import phase — so this needs no timeout bump, and every test after it runs against an
// already-booted instance.
await sharedClient.query("select 1");

export const resetSchema = async (): Promise<void> => {
  await sharedClient.query("DROP SCHEMA public CASCADE");
  await sharedClient.query("CREATE SCHEMA public");
};
