import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (file: string): string => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  // The examples import the packages by their npm names, as a project does; tests run them from src.
  resolve: {
    alias: [
      { find: /^@migration-preflight\/sqlite\/drizzle$/, replacement: path("src/drizzle.ts") },
      { find: /^@migration-preflight\/sqlite$/, replacement: path("src/index.ts") },
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
    // The raw adapter uses node:sqlite, which is behind an experimental flag
    // on Node 22. Inject the flag into the worker that runs the tests.
    execArgv: ["--experimental-sqlite", "--no-warnings"],
  },
});
