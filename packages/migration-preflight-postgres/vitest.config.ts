import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (file: string): string => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  // The examples import the packages by their npm names, as a project does; tests run them from src.
  resolve: {
    alias: [
      { find: /^@migration-preflight\/postgres\/drizzle$/, replacement: path("src/drizzle.ts") },
      { find: /^@migration-preflight\/postgres$/, replacement: path("src/index.ts") },
      {
        find: /^migration-preflight\/sources$/,
        replacement: path("../migration-preflight/src/sources.ts"),
      },
      { find: /^migration-preflight$/, replacement: path("../migration-preflight/src/index.ts") },
    ],
  },
  test: {
    environment: "node",
    watch: false,
    pool: "forks",
    // Every PGlite instance is a full WASM Postgres, about 700MB peak RSS. isolate:false and
    // fileParallelism:false keep every test file on one process and one module instance, so the
    // shared test client boots once for the whole suite.
    isolate: false,
    fileParallelism: false,
  },
});
