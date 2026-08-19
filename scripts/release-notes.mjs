// Creates a GitHub Release (with notes) for every package tag that `changeset publish` has
// created but that doesn't have one yet. Safe to run more than once: already-released tags are
// skipped, so this also backfills any tag that was pushed but never got a release. See
// docs/how-to.md#release-a-new-version and
// docs/explanation.md#why-release-notes-are-a-separate-idempotent-script.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PACKAGES_DIR = "packages";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const tagExists = (tag) => git("tag", "-l", tag).length > 0;

const releaseExists = (tag) => {
  try {
    execFileSync("gh", ["release", "view", tag], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// Pulls the `## <version>` section out of a changesets-generated CHANGELOG.md, matched by exact
// heading text rather than a regex, so a version string never needs escaping.
const changelogSection = (changelog, version) => {
  const heading = `## ${version}`;
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return rest
    .slice(0, end === -1 ? undefined : end)
    .join("\n")
    .trim();
};

const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(PACKAGES_DIR, entry.name));

let missingChangelog = 0;

for (const dir of packageDirs) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const tag = `${pkg.name}@${pkg.version}`;

  if (!tagExists(tag)) {
    console.info(`skip ${tag}: no git tag yet (not published)`);
    continue;
  }
  if (releaseExists(tag)) {
    console.info(`skip ${tag}: GitHub release already exists`);
    continue;
  }

  const notes = changelogSection(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), pkg.version);
  if (!notes) {
    console.error(`no "## ${pkg.version}" section in ${dir}/CHANGELOG.md for tag ${tag}`);
    missingChangelog++;
    continue;
  }

  const notesFile = join(mkdtempSync(join(tmpdir(), "release-notes-")), "notes.md");
  writeFileSync(notesFile, notes);
  execFileSync("gh", ["release", "create", tag, "--title", tag, "--notes-file", notesFile], {
    stdio: "inherit",
  });
  rmSync(notesFile, { force: true });
  console.info(`published release notes for ${tag}`);
}

if (missingChangelog > 0) {
  console.error(`${missingChangelog} package(s) missing a changelog entry, see above`);
  process.exit(1);
}
