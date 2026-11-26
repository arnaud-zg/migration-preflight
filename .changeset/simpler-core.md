---
"migration-preflight": patch
---

`hasRow` and `getRow` now escape a double quote inside a table or column name, and a malformed
Drizzle `meta/_journal.json` fails with an error naming the file instead of a `TypeError`.
