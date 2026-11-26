import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The tests import the core by its npm name; run it from src, so a fresh clone needs no build.
  resolve: {
    alias: [
      {
        find: /^migration-preflight$/,
        replacement: fileURLToPath(new URL("../migration-preflight/src/index.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    watch: false,
    pool: "forks",
    // Every PGlite instance is a full WASM-compiled Postgres (~700MB+ peak RSS on its own — see
    // investigation notes). Vitest's default isolation re-imports each test file in a fresh module
    // registry even within one process, so a "shared" client module still gets re-instantiated per
    // file; isolate:false plus fileParallelism:false keeps every test in this package on the exact
    // same process AND module instance, so the whole suite pays PGlite's WASM boot cost exactly once.
    isolate: false,
    fileParallelism: false,
  },
});
