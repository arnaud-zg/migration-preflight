import { defineLibraryConfig } from "../../tsdown.library.mjs";

// Two entry points: root (the preflight runner) and ./sources — see README for which one to
// import from.
export default defineLibraryConfig({
  entry: {
    index: "src/index.ts",
    sources: "src/sources.ts",
  },
});
