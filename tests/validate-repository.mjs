import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ALLOWED_TOP_LEVEL,
  Validation,
  localMarkdownTargets,
  parseFrontmatter,
  printValidation,
  readJson,
  readText,
  resolveUserPath,
  validateExactMirror,
} from "./lib/validation.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED_FRONTMATTER = new Set(["name", "description"]);
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class UsageError extends Error {}

function parseArgs(argv) {
  const options = {
    skill: null,
    skillsRoot: path.join(REPO_ROOT, "skills"),
    testsRoot: path.join(REPO_ROOT, "tests"),
    installedRoot: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      options.help = true;
      continue;
    }
    const keyMap = new Map([
      ["--skill", "skill"],
      ["--skills-root", "skillsRoot"],
      ["--tests-root", "testsRoot"],
      ["--installed-root", "installedRoot"],
    ]);
    const key = keyMap.get(argument);
    if (!key) {
      throw new UsageError(`unknown argument: ${argument}`);
    }
    if (index + 1 >= argv.length) {
      throw new UsageError(`missing value for ${argument}`);
    }
    options[key] = argv[index + 1];
    index += 1;
  }
  options.skillsRoot = resolveUserPath(options.skillsRoot);
  options.testsRoot = resolveUserPath(options.testsRoot);
  options.installedRoot = options.installedRoot ? resolveUserPath(options.installedRoot) : null;
  return options;
}

function usage() {
  console.log("Usage: node tests/validate-repository.mjs [--skill NAME] [--skills-root PATH] [--tests-root PATH] [--installed-root PATH]");
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function validateEvalFixtures(testsDir, skillName, validation) {
  const evalsPath = path.join(testsDir, "evals.json");
  if (fs.existsSync(evalsPath)) {
    let payload;
    try {
      payload = readJson(evalsPath);
    } catch (error) {
      validation.require(false, `${skillName}: invalid evals.json: ${error.message}`);
      payload = null;
    }
    if (payload) {
      validation.require(payload.skill_name === skillName, `${skillName}: evals.json skill_name must match the Skill`);
      const evals = payload.evals;
      validation.require(Array.isArray(evals) && evals.length >= 8, `${skillName}: evals.json must contain at least 8 execution evals`);
      if (Array.isArray(evals)) {
        const ids = new Set();
        for (const item of evals) {
          const evalId = item?.id;
          validation.require(Number.isInteger(evalId) && !ids.has(evalId), `${skillName}: eval ids must be unique integers; got ${JSON.stringify(evalId)}`);
          ids.add(evalId);
          for (const field of ["prompt", "expected_output"]) {
            validation.require(typeof item?.[field] === "string" && item[field].trim().length > 0, `${skillName}: eval ${evalId} lacks non-empty ${field}`);
          }
          validation.require(
            Array.isArray(item?.expectations)
              && item.expectations.length > 0
              && item.expectations.every((value) => typeof value === "string" && value.trim().length > 0),
            `${skillName}: eval ${evalId} needs non-empty expectations`,
          );
        }
      }
    }
  }

  const triggerPath = path.join(testsDir, "trigger_evals.json");
  if (fs.existsSync(triggerPath)) {
    let triggerEvals;
    try {
      triggerEvals = readJson(triggerPath);
    } catch (error) {
      validation.require(false, `${skillName}: invalid trigger_evals.json: ${error.message}`);
      triggerEvals = null;
    }
    validation.require(Array.isArray(triggerEvals) && triggerEvals.length === 20, `${skillName}: trigger_evals.json must contain exactly 20 queries`);
    if (Array.isArray(triggerEvals)) {
      const queries = new Set();
      let positives = 0;
      let negatives = 0;
      for (const item of triggerEvals) {
        const query = item?.query;
        validation.require(typeof query === "string" && query.trim().length > 0 && !queries.has(query), `${skillName}: trigger queries must be unique, non-empty strings`);
        queries.add(query);
        validation.require(typeof item?.should_trigger === "boolean", `${skillName}: trigger query lacks a boolean should_trigger: ${JSON.stringify(query)}`);
        if (item?.should_trigger === true) positives += 1;
        if (item?.should_trigger === false) negatives += 1;
      }
      validation.require(positives === 10 && negatives === 10, `${skillName}: trigger evals need 10 positive and 10 negative cases; got true=${positives}, false=${negatives}`);
    }
  }
}

function validateHumanDocumentation(validation) {
  const markdownFiles = [path.join(REPO_ROOT, "README.md")];
  const docsRoot = path.join(REPO_ROOT, "docs");
  if (fs.existsSync(docsRoot)) {
    const visit = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(absolute);
        if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(absolute);
      }
    };
    visit(docsRoot);
  }
  for (const markdown of markdownFiles) {
    for (const target of localMarkdownTargets(markdown, readText(markdown))) {
      validation.require(fs.existsSync(target), `broken documentation link in ${path.relative(REPO_ROOT, markdown)}: ${target}`);
    }
  }
}

export async function validateRepository(options) {
  const validation = new Validation();
  const { skillsRoot, testsRoot, installedRoot } = options;
  validation.require(fs.existsSync(skillsRoot) && fs.statSync(skillsRoot).isDirectory(), `missing skills directory: ${skillsRoot}`);
  if (!fs.existsSync(skillsRoot) || !fs.statSync(skillsRoot).isDirectory()) {
    return { validation, selected: [] };
  }

  const candidateDirs = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(skillsRoot, entry.name))
    .sort();
  validation.require(candidateDirs.length > 0, "skills directory contains no Skill folders");

  const skillDirs = new Map();
  const phraseOwners = new Map();
  for (const skillDir of candidateDirs) {
    const folderName = path.basename(skillDir);
    const skillFile = path.join(skillDir, "SKILL.md");
    validation.require(fs.existsSync(skillFile), `Skill folder is missing SKILL.md: ${folderName}`);
    if (!fs.existsSync(skillFile)) continue;

    const parsed = parseFrontmatter(readText(skillFile));
    for (const error of parsed.errors) {
      validation.require(false, `${folderName}: invalid frontmatter: ${error}`);
    }
    const keys = new Set(parsed.keys);
    validation.require(
      sameSet(keys, ALLOWED_FRONTMATTER),
      `${folderName}: frontmatter keys must be exactly ${JSON.stringify([...ALLOWED_FRONTMATTER].sort())}; got ${JSON.stringify(parsed.keys.sort())}`,
    );
    const declaredName = parsed.data?.name;
    const description = parsed.data?.description;
    validation.require(typeof declaredName === "string" && declaredName === folderName, `${folderName}: frontmatter name must match folder name; got ${JSON.stringify(declaredName)}`);
    validation.require(SKILL_NAME.test(folderName) && folderName.length <= 64, `invalid Skill folder name: ${folderName}`);
    validation.require(!skillDirs.has(declaredName), `duplicate Skill name: ${declaredName}`);
    if (typeof declaredName === "string") skillDirs.set(declaredName, skillDir);
    validation.require(typeof description === "string" && description.trim().length > 0, `${folderName}: description must be a non-empty string`);
    if (typeof description === "string") {
      validation.require(description.length <= 1024, `${folderName}: description exceeds 1024 characters`);
      validation.require(!/[<>]/.test(description), `${folderName}: description cannot contain angle brackets`);
      const quoted = [...description.matchAll(/["“]([^"”]{2,})["”]/g)].map((match) => match[1]);
      validation.require(quoted.length >= 2, `${folderName}: description must contain at least two quoted natural-language trigger phrases`);
      for (const phrase of quoted) {
        const normalized = phrase.toLocaleLowerCase().trim().replace(/\s+/g, " ");
        const owner = phraseOwners.get(normalized);
        validation.require(!owner || owner === folderName, `duplicate quoted trigger phrase across Skills: ${JSON.stringify(phrase)} (${owner}, ${folderName})`);
        phraseOwners.set(normalized, folderName);
      }
    }

    const unexpected = fs.readdirSync(skillDir).filter((entry) => !ALLOWED_TOP_LEVEL.has(entry));
    validation.require(unexpected.length === 0, `${folderName}: unexpected installable top-level entries: ${JSON.stringify(unexpected.sort())}`);
  }

  let selected;
  if (options.skill) {
    const selectedDir = skillDirs.get(options.skill);
    validation.require(Boolean(selectedDir), `requested Skill not found: ${options.skill}`);
    selected = selectedDir ? [[options.skill, selectedDir]] : [];
  } else {
    selected = [...skillDirs.entries()].filter(([name]) => typeof name === "string").sort(([left], [right]) => left.localeCompare(right));
  }

  validateHumanDocumentation(validation);
  for (const [skillName, skillDir] of selected) {
    const skillTests = path.join(testsRoot, skillName);
    validateEvalFixtures(skillTests, skillName, validation);
    const requestedValidator = path.join(skillTests, "validate.mjs");
    const defaultValidator = path.join(REPO_ROOT, "tests", skillName, "validate.mjs");
    const validatorPath = fs.existsSync(requestedValidator) ? requestedValidator : defaultValidator;
    validation.require(fs.existsSync(validatorPath), `${skillName}: missing domain validator: ${validatorPath}`);
    if (fs.existsSync(validatorPath)) {
      const module = await import(`${pathToFileURL(validatorPath).href}?mtime=${fs.statSync(validatorPath).mtimeMs}`);
      const domain = module.validateSkill(skillDir, { casesPath: path.join(skillTests, "behavior_cases.json") });
      validation.checks += domain.checks;
      validation.errors.push(...domain.errors.map((error) => `${skillName}: ${error}`));
      validation.warnings.push(...domain.warnings.map((warning) => `${skillName}: ${warning}`));
    }
    if (installedRoot) {
      validateExactMirror(skillDir, path.join(installedRoot, skillName), validation, `installed ${skillName}`);
    }
  }
  return { validation, selected };
}

async function cli() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exitCode = error instanceof UsageError ? 2 : 1;
    return;
  }
  if (options.help) {
    usage();
    return;
  }
  const { validation, selected } = await validateRepository(options);
  const ok = printValidation(validation, `PASS: repository structure and ${selected.length} Skill validation set(s) ({checks} checks)`);
  process.exitCode = ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await cli();
}
