// Ports for running database migrations, independent of any driver or dialect.

/** A scalar that can be bound into a SQL statement. */
export type SqlValue = string | number | null;

/** A row returned by a query. */
export type SqlRow = Record<string, unknown>;

/** A parametrised statement: SQL with placeholders and their bound values. */
export type SqlStatement = { readonly sql: string; readonly params: readonly SqlValue[] };

/** One migration in journal order: its index, tag, and raw SQL. */
export type Migration = { readonly idx: number; readonly tag: string; readonly sql: string };

/**
 * Dialect-specific SQL rendering the chain needs to stay driver-agnostic.
 * `placeholder` renders the bound-parameter marker for the given zero-based
 * position (SQLite: always `?`; Postgres: `$1`, `$2`, …).
 */
export interface SqlDialect {
  placeholder: (index: number) => string;
}

/**
 * The database operations a migration run needs, abstracted from the driver.
 * Implemented by adapters over a concrete database (node:sqlite / PGlite in
 * tests; a production app might run on expo-sqlite or postgres-js through Drizzle).
 *
 * Every operation may be sync or async so one chain can drive both a
 * synchronous driver (node:sqlite) and an async-only one (PGlite).
 */
export interface MigrationDatabase {
  /** The dialect's SQL rendering rules. */
  readonly dialect: SqlDialect;
  /** Runs a single statement (optionally parametrised) with no result. */
  run: (sql: string, parameters?: readonly SqlValue[]) => Promise<void> | void;
  /** Runs a query and returns every row. */
  query: (sql: string, parameters?: readonly SqlValue[]) => Promise<SqlRow[]> | SqlRow[];
  /** Runs work inside one transaction, rolling back if it throws. */
  transaction: (work: () => Promise<void> | void) => Promise<void> | void;
  /**
   * Rows that violate a foreign key (empty when integrity holds). Dialects
   * that enforce foreign keys immediately (Postgres) rather than offering a
   * deferred-check query (SQLite's `PRAGMA foreign_key_check`) may always
   * return `[]` here — a violation instead surfaces as a thrown error while
   * applying the migration or seed that caused it.
   */
  foreignKeyViolations: () => Promise<SqlRow[]> | SqlRow[];
}
