# CLAUDE.md

- Three published packages: `packages/migration-preflight` (the core, zero runtime dependencies),
  `packages/migration-preflight-sqlite` and `packages/migration-preflight-postgres`. Keep database
  and ORM code out of the core.
- Any change to a package's `src` adds a changeset: see
  [Changeset rules](docs/contributing/reference.md#changeset-rules). No breaking change to the
  public API (`src/index.ts`, `src/sources.ts`, `src/drizzle.ts`) without a `0.x` minor changeset
  that says so.
- `pnpm verify` must pass before a pull request; no CI runs it.
- When a package README or its `package.json` `description`/`keywords` changes, follow
  [Findability rules](docs/contributing/reference.md#findability-rules) and add a patch changeset:
  npm only shows them after a release.
- A change users see updates `docs/migration-preflight/`; examples the docs show live in the
  adapters' `examples/`, run by their `src/examples.integration.test.ts`.
