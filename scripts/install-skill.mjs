import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  ALLOWED_TOP_LEVEL,
  compareTrees,
  listTree,
  resolveUserPath,
  validateExactMirror,
  Validation,
} from "../tests/lib/validation.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class UsageError extends Error {}

function parseArgs(argv) {
  const options = {
    names: [],
    all: false,
    dryRun: false,
    sourceRoot: path.join(repoRoot, "skills"),
    destinationRoot: path.join(os.homedir(), ".codex", "skills"),
    backupRoot: path.join(repoRoot, ".artifacts", "backups"),
  };
  const valueOptions = new Map([
    ["--name", "name"],
    ["--source-root", "sourceRoot"],
    ["--destination-root", "destinationRoot"],
    ["--backup-root", "backupRoot"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      options.help = true;
      continue;
    }
    if (argument === "--all") {
      options.all = true;
      continue;
    }
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    const key = valueOptions.get(argument);
    if (!key) {
      throw new UsageError(`unknown argument: ${argument}`);
    }
    if (index + 1 >= argv.length) {
      throw new UsageError(`missing value for ${argument}`);
    }
    const value = argv[index + 1];
    if (key === "name") options.names.push(value);
    else options[key] = value;
    index += 1;
  }
  if (!options.help && options.all === (options.names.length > 0)) {
    throw new UsageError("choose exactly one of --name <skill> or --all");
  }
  for (const name of options.names) {
    if (!SKILL_NAME.test(name)) {
      throw new UsageError(`invalid Skill name: ${name}`);
    }
  }
  options.sourceRoot = resolveUserPath(options.sourceRoot);
  options.destinationRoot = resolveUserPath(options.destinationRoot);
  options.backupRoot = resolveUserPath(options.backupRoot);
  return options;
}

function usage() {
  console.log("Usage: npm run skill:install -- (--name NAME | --all) [--dry-run] [--source-root PATH] [--destination-root PATH] [--backup-root PATH]");
}

function isPathInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function ensureSafePaths(sourceRoot, sourcePath, destinationRoot, destinationPath) {
  if (path.dirname(sourcePath) !== sourceRoot || path.dirname(destinationPath) !== destinationRoot) {
    throw new Error("Skill paths must be direct children of their configured roots");
  }
  if (
    sourcePath === destinationPath
    || isPathInside(sourcePath, destinationPath)
    || isPathInside(destinationPath, sourcePath)
  ) {
    throw new Error(`source and destination paths must not overlap: ${sourcePath} / ${destinationPath}`);
  }
  if (fs.existsSync(destinationPath) && fs.lstatSync(destinationPath).isSymbolicLink()) {
    throw new Error(`destination Skill directory must not be a symbolic link: ${destinationPath}`);
  }
  listTree(sourcePath, { includeDirectories: true, rejectSymlinks: true });
  if (fs.existsSync(destinationPath)) {
    listTree(destinationPath, { includeDirectories: true, rejectSymlinks: true });
  }
}

function discoverSkills(sourceRoot) {
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
    throw new Error(`Skill source root not found: ${sourceRoot}`);
  }
  return fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && fs.existsSync(path.join(sourceRoot, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function validateTopLevel(sourcePath) {
  const unexpected = fs.readdirSync(sourcePath).filter((entry) => !ALLOWED_TOP_LEVEL.has(entry));
  if (unexpected.length > 0) {
    throw new Error(`installable Skill contains unexpected top-level items: ${unexpected.sort().join(", ")}`);
  }
}

function runRepositoryValidation(sourceRoot, names, all) {
  const base = ["tests/validate-repository.mjs", "--skills-root", sourceRoot];
  const runs = all ? [base] : names.map((name) => [...base, "--skill", name]);
  for (const argumentsList of runs) {
    const result = spawnSync(process.execPath, argumentsList, {
      cwd: repoRoot,
      stdio: "inherit",
      windowsHide: true,
    });
    if (result.error) {
      throw new Error(`failed to start repository validation: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(`repository validation failed with exit code ${result.status}`);
    }
  }
}

function formatTimestamp(date = new Date()) {
  const pad = (value, length = 2) => String(value).padStart(length, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${pad(date.getMilliseconds(), 3)}`;
}

function uniqueSibling(root, name, kind) {
  return path.join(root, `.${name}.${kind}-${process.pid}-${Math.random().toString(16).slice(2)}`);
}

function printDiff(diff) {
  for (const relative of diff.addedDirectories) console.log(`ADD DIR    ${relative}`);
  for (const relative of diff.added) console.log(`ADD        ${relative}`);
  for (const relative of diff.updated) console.log(`UPDATE     ${relative}`);
  for (const relative of diff.removed) console.log(`DELETE     ${relative}`);
  for (const relative of [...diff.removedDirectories].reverse()) console.log(`DELETE DIR ${relative}`);
  if (
    diff.added.length === 0
    && diff.updated.length === 0
    && diff.removed.length === 0
    && diff.addedDirectories.length === 0
    && diff.removedDirectories.length === 0
  ) {
    console.log("NO CHANGES");
  }
}

function hasChanges(diff) {
  return diff.added.length > 0
    || diff.updated.length > 0
    || diff.removed.length > 0
    || diff.addedDirectories.length > 0
    || diff.removedDirectories.length > 0;
}

function assertExactMirror(sourcePath, destinationPath, label) {
  const validation = new Validation();
  validateExactMirror(sourcePath, destinationPath, validation, label);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("; "));
  }
}

function installOne({ name, sourcePath, destinationPath, destinationRoot, backupRoot, timestamp }) {
  fs.mkdirSync(destinationRoot, { recursive: true });
  const stagingPath = uniqueSibling(destinationRoot, name, "staging");
  const rollbackPath = uniqueSibling(destinationRoot, name, "rollback");
  const backupPath = path.join(backupRoot, timestamp, name);
  let oldMoved = false;
  let newActivated = false;

  try {
    fs.cpSync(sourcePath, stagingPath, { recursive: true, errorOnExist: true, force: false });
    assertExactMirror(sourcePath, stagingPath, `staging ${name}`);

    if (fs.existsSync(destinationPath)) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.cpSync(destinationPath, backupPath, { recursive: true, errorOnExist: true, force: false });
      assertExactMirror(destinationPath, backupPath, `backup ${name}`);
      fs.renameSync(destinationPath, rollbackPath);
      oldMoved = true;
    }

    fs.renameSync(stagingPath, destinationPath);
    newActivated = true;
    assertExactMirror(sourcePath, destinationPath, `installed ${name}`);

    if (oldMoved) {
      fs.rmSync(rollbackPath, { recursive: true, force: true });
      oldMoved = false;
    }
    return fs.existsSync(backupPath) ? backupPath : null;
  } catch (error) {
    if (newActivated && fs.existsSync(destinationPath)) {
      fs.rmSync(destinationPath, { recursive: true, force: true });
    }
    if (oldMoved && fs.existsSync(rollbackPath) && !fs.existsSync(destinationPath)) {
      fs.renameSync(rollbackPath, destinationPath);
      oldMoved = false;
    }
    throw error;
  } finally {
    if (fs.existsSync(stagingPath)) fs.rmSync(stagingPath, { recursive: true, force: true });
    if (fs.existsSync(rollbackPath) && !oldMoved) fs.rmSync(rollbackPath, { recursive: true, force: true });
  }
}

export function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    usage();
    return error instanceof UsageError ? 2 : 1;
  }
  if (options.help) {
    usage();
    return 0;
  }

  try {
    const available = discoverSkills(options.sourceRoot);
    const names = options.all ? available : [...new Set(options.names)];
    if (names.length === 0) throw new Error("no Skills found to install");
    for (const name of names) {
      if (!available.includes(name)) throw new Error(`Skill source not found: ${path.join(options.sourceRoot, name)}`);
      const sourcePath = path.join(options.sourceRoot, name);
      const destinationPath = path.join(options.destinationRoot, name);
      validateTopLevel(sourcePath);
      ensureSafePaths(options.sourceRoot, sourcePath, options.destinationRoot, destinationPath);
    }

    runRepositoryValidation(options.sourceRoot, names, options.all);
    const timestamp = formatTimestamp();
    for (const name of names) {
      const sourcePath = path.join(options.sourceRoot, name);
      const destinationPath = path.join(options.destinationRoot, name);
      const diff = compareTrees(sourcePath, destinationPath);
      console.log(`\nSkill:       ${name}`);
      console.log(`Source:      ${sourcePath}`);
      console.log(`Destination: ${destinationPath}`);
      printDiff(diff);
      const changed = hasChanges(diff);
      if (changed && fs.existsSync(destinationPath)) {
        console.log(`Backup:      ${path.join(options.backupRoot, timestamp, name)}`);
      }
      if (options.dryRun) {
        console.log("DRY RUN: no files were written.");
        continue;
      }
      if (!changed) {
        console.log("Already current: no backup or write was needed.");
        continue;
      }
      const backupPath = installOne({
        name,
        sourcePath,
        destinationPath,
        destinationRoot: options.destinationRoot,
        backupRoot: options.backupRoot,
        timestamp,
      });
      if (backupPath) console.log(`Backed up:   ${backupPath}`);
      console.log(`Installed and verified ${name}.`);
    }
    return 0;
  } catch (error) {
    console.error(`FAILED: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
