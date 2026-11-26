# CLAUDE.md

- `pnpm verify` runs typecheck, lint, Markdown lint, format check, tests and build: run it before a
  pull request, no CI runs it.
- A change to a package's `src` needs a changeset:
  `pnpm changeset --patch <pkg> -m "What now works."`.
- No breaking change to the public API (`src/index.ts`, `src/sources.ts`, `src/drizzle.ts`) without
  a major or a `0.x` minor changeset that says so.
