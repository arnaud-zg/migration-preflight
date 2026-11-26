import type { SqlValue } from "./migrationChain.ports";

const STATEMENT_BREAKPOINT = "--> statement-breakpoint";

/**
 * Splits a migration into the statements a stepwise migrator executes: one
 * per breakpoint marker. This is the load-bearing rule — such a migrator runs a
 * single prepared statement per chunk, so statements not separated by a marker
 * (and anything after the first in a chunk) never run. Drizzle emits this same
 * marker for every dialect, so this rule applies unchanged to Postgres output.
 */
export const splitIntoStatements = (migrationSql: string): string[] =>
  migrationSql
    .split(STATEMENT_BREAKPOINT)
    .map((chunk) => chunk.trim())
    .filter((statement) => statement.length > 0);

const escape = (value: SqlValue): string => {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
};

/**
 * Renders an INSERT for a row. Columns whose value is `undefined` are omitted so
 * the database default (or NULL) applies rather than inserting an explicit NULL.
 */
export const renderInsert = (
  table: string,
  row: Readonly<Record<string, SqlValue | undefined>>,
): string => {
  const entries = Object.entries(row).filter(
    (entry): entry is [string, SqlValue] => entry[1] !== undefined,
  );
  const columns = entries.map(([column]) => column).join(", ");
  const values = entries.map(([, value]) => escape(value)).join(", ");
  return `INSERT INTO ${table} (${columns}) VALUES (${values})`;
};
