import { defineLibraryConfig } from "@arnaud-zg/configs/tsdown";

// Two entry points: root (the raw node:sqlite adapter) and ./drizzle (the drizzle-native migrator
// runner) — kept separate so importing the raw adapter never requires drizzle-orm / better-sqlite3.
// See README.
export default defineLibraryConfig({
  entry: {
    index: "src/index.ts",
    drizzle: "src/drizzle.ts",
  },
});
