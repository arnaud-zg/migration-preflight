import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runDrizzlePgliteMigrations } from "../drizzlePgliteRunner";
import { resetSchema, sharedClient } from "./pgliteTestClient";

describe("runDrizzlePgliteMigrations", () => {
  it("applies every migration cleanly through drizzle's own migrator", async () => {
    await resetSchema();
    const migrationsFolder = join(import.meta.dirname, "fixtures", "migrations");

    await expect(
      runDrizzlePgliteMigrations({ migrationsFolder, client: sharedClient }),
    ).resolves.toBeUndefined();
  });

  it("accepts a caller-supplied client (e.g. one with extensions loaded) and leaves it open", async () => {
    await resetSchema();
    const migrationsFolder = join(import.meta.dirname, "fixtures", "migrations");

    await runDrizzlePgliteMigrations({ migrationsFolder, client: sharedClient });

    // Not closed by the runner — the caller owns a client it supplied.
    expect(sharedClient.closed).toBe(false);
  });
});
