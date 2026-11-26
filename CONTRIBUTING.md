# Contributing

Bug reports, ideas and pull requests are all welcome.

## Report an issue

[Open an issue](https://github.com/arnaud-zg/migration-preflight/issues/new/choose) and pick the
package. One sentence is enough to start; a failing migration helps but is optional.

## Create a pull request

You need Node 22 or later, pnpm 10.10 or later, and the [GitHub CLI](https://cli.github.com) (or
fork and open the pull request on github.com). For a large change, open an issue first.

**1. Fork, clone and install**

```sh
gh repo fork arnaud-zg/migration-preflight --clone
cd migration-preflight
pnpm install
```

**2. Create a branch and make your change**

```sh
git checkout -b fix/short-description
pnpm --filter <pkg> test   # tests for one package
```

Add a test for a fix or a feature. When users will see the change, update the package README and the
[docs](./docs/README.md); an example the docs show lives in the package's `examples/`, run by its
`src/examples.integration.test.ts`.

**3. Add a changeset for any change npm users will get**

```sh
pnpm changeset --patch <pkg> -m "What now works."        # fix, perf, refactor
pnpm changeset --minor <pkg> -m "What users can now do."  # feat, or a breaking change below 1.0.0
```

A change to a package README, or to `description` or `keywords` in its `package.json`, is a
`--patch` too: npm only shows them after a release. Changes to `docs/`, examples and tooling need
none. Every case: [Changeset rules](./docs/contributing/reference.md#changeset-rules).

**4. Check, commit and push**

```sh
pnpm verify   # typecheck, lint, format, test, build
git add .
git commit -m "fix(<pkg>): short description"
git push -u origin HEAD
```

**5. Open the pull request**

```sh
gh pr create
```

- Keep one change per pull request, with a
  [conventional commit](https://www.conventionalcommits.org) title such as
  `fix(migration-preflight): ...`: it becomes the commit on `main`. The scope is required.
- Say what changes and why, and link the issue (`Closes #123`).
- Run `pnpm verify` before asking for a review: no CI runs it on pull requests.

The maintainer reviews it and squash-merges it.

## Release (maintainer)

Releasing, publishing from GitHub Actions and deprecating a package on npm:
[Contributing how-to](./docs/contributing/how-to.md).
