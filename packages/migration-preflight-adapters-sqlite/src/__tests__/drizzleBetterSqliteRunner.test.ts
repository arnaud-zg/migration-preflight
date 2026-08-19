import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runDrizzleBetterSqliteMigrations } from "../drizzleBetterSqliteRunner";

describe("runDrizzleBetterSqliteMigrations", () => {
  it("applies every migration cleanly through drizzle's own migrator", () => {
    const migrationsFolder = join(import.meta.dirname, "fixtures", "migrations");

    expect(() => runDrizzleBetterSqliteMigrations({ migrationsFolder })).not.toThrow();
  });
});
