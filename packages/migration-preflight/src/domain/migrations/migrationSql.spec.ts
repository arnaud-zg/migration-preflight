import { describe, expect, it } from "vitest";

import { renderInsert, splitIntoStatements } from "./migrationSql";

describe("splitIntoStatements", () => {
  it("splits on the breakpoint marker and trims each statement", () => {
    const sql = "CREATE TABLE a (id text);\n--> statement-breakpoint\nDROP TABLE a;";
    expect(splitIntoStatements(sql)).toEqual(["CREATE TABLE a (id text);", "DROP TABLE a;"]);
  });

  it("drops empty chunks", () => {
    expect(splitIntoStatements("--> statement-breakpoint\n\n--> statement-breakpoint")).toEqual([]);
  });

  it("keeps a multi-statement chunk whole (as the migrator would run only its first)", () => {
    const chunk = "PRAGMA foreign_keys=OFF;\nCREATE TABLE a (id text);";
    expect(splitIntoStatements(chunk)).toEqual([chunk]);
  });
});

describe("renderInsert", () => {
  it("quotes strings, inlines numbers, and writes NULL", () => {
    expect(renderInsert("users", { id: "u1", age: 3, nickname: null })).toBe(
      "INSERT INTO users (id, age, nickname) VALUES ('u1', 3, NULL)",
    );
  });

  it("escapes single quotes", () => {
    expect(renderInsert("t", { id: "O'Hara" })).toBe("INSERT INTO t (id) VALUES ('O''Hara')");
  });

  it("omits undefined columns so the database default applies", () => {
    expect(renderInsert("t", { id: "x", optional: undefined })).toBe(
      "INSERT INTO t (id) VALUES ('x')",
    );
  });
});
