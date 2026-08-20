---
"migration-preflight": patch
---

✨ **`applyAll()`**: apply your whole migration history in one call.

- No more `migrations.at(-1)!.idx` math
- Defaults to seeding nothing, perfect for the "does it apply cleanly" check
- Empty history? No throw, just a no-op

`applyThrough(maxIdx, seedsAfter)` is still there for a specific cutoff.
