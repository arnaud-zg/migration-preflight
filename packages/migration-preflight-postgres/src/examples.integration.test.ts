import { describe, expect, it } from "vitest";

import { applyWithDrizzle, seedSurvivesWithTrigram } from "../examples/extensions";

// The docs link these files, so each one runs here as a project would run it.
describe("the examples the docs show", () => {
  it("extensions: a seed survives a history that needs pg_trgm, on a client that loads it", async () => {
    expect(await seedSurvivesWithTrigram()).toBe(true);
  });

  it("extensions: Drizzle's own migrator applies that history on a client that loads it", async () => {
    await expect(applyWithDrizzle()).resolves.toBeUndefined();
  });
});
