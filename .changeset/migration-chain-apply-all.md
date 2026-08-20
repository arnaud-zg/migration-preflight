---
"migration-preflight": patch
---

Stop computing `migrations.at(-1)!.idx` by hand every time you want to apply the whole history.

`MigrationChain.applyAll(seedsAfter?)` does what nearly every test already wrote out longhand:
`applyThrough` against the last migration, with `seedsAfter` defaulting to seeding nothing for the
plain "does it apply cleanly" check. It also handles an empty migration history gracefully instead
of throwing, which the non-null assertion in the old pattern didn't.

`applyThrough(maxIdx, seedsAfter)` is unchanged and still there for the cases that actually need a
specific cutoff, e.g. driving one test case per migration.
