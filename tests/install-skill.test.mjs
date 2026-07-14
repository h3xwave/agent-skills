import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { compareTrees } from "./lib/validation.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(repoRoot, "scripts", "install-skill.mjs");

function runInstaller(argumentsList) {
  return spawnSync(process.execPath, [installer, ...argumentsList], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
}

function withFixture(skillNames, callback) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "skill-installer-"));
  const sourceRoot = path.join(temp, "source");
  const destinationRoot = path.join(temp, "destination");
  const backupRoot = path.join(temp, "backups");
  fs.mkdirSync(sourceRoot, { recursive: true });
  fs.mkdirSync(destinationRoot, { recursive: true });
  for (const name of skillNames) {
    fs.cpSync(path.join(repoRoot, "skills", name), path.join(sourceRoot, name), { recursive: true });
  }
  try {
    return callback({ temp, sourceRoot, destinationRoot, backupRoot });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function commonArguments({ sourceRoot, destinationRoot, backupRoot }) {
  return [
    "--source-root", sourceRoot,
    "--destination-root", destinationRoot,
    "--backup-root", backupRoot,
  ];
}

test("dry-run reports deletions without writing", () => withFixture(["design-image-prompt-engineer"], (fixture) => {
  const installed = path.join(fixture.destinationRoot, "design-image-prompt-engineer");
  fs.mkdirSync(installed, { recursive: true });
  fs.writeFileSync(path.join(installed, "stale.txt"), "stale");
  const result = runInstaller([
    "--name", "design-image-prompt-engineer",
    "--dry-run",
    ...commonArguments(fixture),
  ]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /DELETE\s+stale\.txt/);
  assert.equal(fs.readFileSync(path.join(installed, "stale.txt"), "utf8"), "stale");
  assert.equal(fs.existsSync(fixture.backupRoot), false);
}));

test("installation creates an exact mirror and backs up stale files", () => withFixture(["design-image-prompt-engineer"], (fixture) => {
  const name = "design-image-prompt-engineer";
  const installed = path.join(fixture.destinationRoot, name);
  fs.mkdirSync(installed, { recursive: true });
  fs.writeFileSync(path.join(installed, "stale.txt"), "stale");
  const result = runInstaller(["--name", name, ...commonArguments(fixture)]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(fs.existsSync(path.join(installed, "stale.txt")), false);
  const diff = compareTrees(path.join(fixture.sourceRoot, name), installed);
  assert.deepEqual(diff, { added: [], updated: [], removed: [], addedDirectories: [], removedDirectories: [] });
  const timestamps = fs.readdirSync(fixture.backupRoot);
  assert.equal(timestamps.length, 1);
  assert.equal(fs.readFileSync(path.join(fixture.backupRoot, timestamps[0], name, "stale.txt"), "utf8"), "stale");

  const second = runInstaller(["--name", name, ...commonArguments(fixture)]);
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.match(second.stdout, /NO CHANGES/);
  assert.match(second.stdout, /no backup or write was needed/);
  assert.deepEqual(fs.readdirSync(fixture.backupRoot), timestamps);
}));

test("validation failure leaves the destination untouched", () => withFixture(["patent-disclosure"], (fixture) => {
  const name = "patent-disclosure";
  const installed = path.join(fixture.destinationRoot, name);
  fs.mkdirSync(installed, { recursive: true });
  fs.writeFileSync(path.join(installed, "keep.txt"), "keep");
  const skillFile = path.join(fixture.sourceRoot, name, "SKILL.md");
  fs.writeFileSync(skillFile, fs.readFileSync(skillFile, "utf8").replace("name: patent-disclosure", "name: wrong-name"));
  const result = runInstaller(["--name", name, ...commonArguments(fixture)]);
  assert.equal(result.status, 1);
  assert.equal(fs.readFileSync(path.join(installed, "keep.txt"), "utf8"), "keep");
  assert.equal(fs.existsSync(fixture.backupRoot), false);
}));

test("--all discovers every Skill without a maintained install list", () => withFixture([
  "design-image-prompt-engineer",
  "patent-disclosure",
], (fixture) => {
  const result = runInstaller(["--all", "--dry-run", ...commonArguments(fixture)]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Skill:\s+design-image-prompt-engineer/);
  assert.match(result.stdout, /Skill:\s+patent-disclosure/);
}));

test("invalid or conflicting selection arguments return usage status 2", () => {
  const conflict = runInstaller(["--all", "--name", "patent-disclosure"]);
  assert.equal(conflict.status, 2);
  const traversal = runInstaller(["--name", "../patent-disclosure"]);
  assert.equal(traversal.status, 2);
});

test("overlapping source and destination paths are rejected without mutation", () => withFixture(["design-image-prompt-engineer"], (fixture) => {
  const skillFile = path.join(fixture.sourceRoot, "design-image-prompt-engineer", "SKILL.md");
  const before = fs.readFileSync(skillFile, "utf8");
  const result = runInstaller([
    "--name", "design-image-prompt-engineer",
    "--source-root", fixture.sourceRoot,
    "--destination-root", fixture.sourceRoot,
    "--backup-root", fixture.backupRoot,
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must not overlap/);
  assert.equal(fs.readFileSync(skillFile, "utf8"), before);
  assert.equal(fs.existsSync(fixture.backupRoot), false);
}));
