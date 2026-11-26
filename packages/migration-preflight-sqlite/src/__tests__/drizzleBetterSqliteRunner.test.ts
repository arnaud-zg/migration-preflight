import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runDrizzleBetterSqliteMigrations } from "../drizzleBetterSqliteRunner";

const fixture = (name: string): string => join(import.meta.dirname, "fixtures", name);

describe("runDrizzleBetterSqliteMigrations", () => {
  it("applies every migration cleanly through drizzle's own migrator", () => {
    expect(() =>
      runDrizzleBetterSqliteMigrations({ migrationsFolder: fixture("migrations") }),
    ).not.toThrow();
  });

  it("fails when a migration does not apply", () => {
    expect(() =>
      runDrizzleBetterSqliteMigrations({ migrationsFolder: fixture("broken-migrations") }),
    ).toThrow();
  });
});
