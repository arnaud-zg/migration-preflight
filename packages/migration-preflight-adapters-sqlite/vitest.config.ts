import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    watch: false,
    pool: "forks",
    // The raw adapter uses node:sqlite, which is behind an experimental flag
    // on Node 22. Inject the flag into the worker that runs the tests.
    execArgv: ["--experimental-sqlite", "--no-warnings"],
  },
});
