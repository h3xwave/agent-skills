import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(repoRoot, "tests", "validate-repository.mjs");

function runValidator(argumentsList = []) {
  return spawnSync(process.execPath, [validator, ...argumentsList], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
}

function withTempDirectory(callback) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "skills-validator-"));
  try {
    return callback(temp);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function copySkill(temp, name) {
  const skillsRoot = path.join(temp, "skills");
  fs.mkdirSync(skillsRoot, { recursive: true });
  fs.cpSync(path.join(repoRoot, "skills", name), path.join(skillsRoot, name), { recursive: true });
  return skillsRoot;
}

test("valid repository passes the Node validator", () => {
  const result = runValidator();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PASS: repository structure and 2 Skill validation set/);
});

test("unexpected frontmatter fields fail validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "design-image-prompt-engineer");
  const skillFile = path.join(skillsRoot, "design-image-prompt-engineer", "SKILL.md");
  const text = fs.readFileSync(skillFile, "utf8").replace("description: >", "unexpected: true\ndescription: >");
  fs.writeFileSync(skillFile, text);
  const result = runValidator(["--skill", "design-image-prompt-engineer", "--skills-root", skillsRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /frontmatter keys must be exactly/);
}));

test("invalid YAML frontmatter fails validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "patent-disclosure");
  const skillFile = path.join(skillsRoot, "patent-disclosure", "SKILL.md");
  const text = fs.readFileSync(skillFile, "utf8").replace("description: >", "description: [");
  fs.writeFileSync(skillFile, text);
  const result = runValidator(["--skill", "patent-disclosure", "--skills-root", skillsRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid frontmatter/);
}));

test("duplicate quoted trigger phrases across Skills fail validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "design-image-prompt-engineer");
  fs.cpSync(path.join(repoRoot, "skills", "patent-disclosure"), path.join(skillsRoot, "patent-disclosure"), { recursive: true });
  const skillFile = path.join(skillsRoot, "patent-disclosure", "SKILL.md");
  const text = fs.readFileSync(skillFile, "utf8").replace("“我有个发明想申请专利”", "\"写图片提示词\"");
  fs.writeFileSync(skillFile, text);
  const result = runValidator(["--skills-root", skillsRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /duplicate quoted trigger phrase across Skills/);
}));

test("broken local Markdown links fail validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "design-image-prompt-engineer");
  const skillFile = path.join(skillsRoot, "design-image-prompt-engineer", "SKILL.md");
  fs.appendFileSync(skillFile, "\n[broken](references/does-not-exist.md)\n");
  const result = runValidator(["--skill", "design-image-prompt-engineer", "--skills-root", skillsRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /broken Markdown path/);
}));

test("future platform verification dates fail validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "design-image-prompt-engineer");
  const platform = path.join(skillsRoot, "design-image-prompt-engineer", "references", "platforms", "midjourney.md");
  const text = fs.readFileSync(platform, "utf8").replace(/Last verified: \d{4}-\d{2}-\d{2}/, "Last verified: 2999-01-01");
  fs.writeFileSync(platform, text);
  const result = runValidator(["--skill", "design-image-prompt-engineer", "--skills-root", skillsRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /verification date is in the future/);
}));

test("legacy resources and obsolete platform syntax fail validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "design-image-prompt-engineer");
  const skillDir = path.join(skillsRoot, "design-image-prompt-engineer");
  fs.writeFileSync(path.join(skillDir, "references", "photorealism.md"), "# legacy\n");
  fs.appendFileSync(path.join(skillDir, "references", "style-library.md"), "\n--style raw\n");
  const result = runValidator(["--skill", "design-image-prompt-engineer", "--skills-root", skillsRoot]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /legacy resource must be removed/);
  assert.match(result.stderr, /obsolete Midjourney syntax/);
}));

test("invalid trigger evaluation structure fails validation", () => withTempDirectory((temp) => {
  const skillsRoot = copySkill(temp, "patent-disclosure");
  const testsRoot = path.join(temp, "tests");
  const skillTests = path.join(testsRoot, "patent-disclosure");
  fs.mkdirSync(skillTests, { recursive: true });
  for (const file of ["behavior_cases.json", "evals.json", "trigger_evals.json"]) {
    fs.copyFileSync(path.join(repoRoot, "tests", "patent-disclosure", file), path.join(skillTests, file));
  }
  const triggerPath = path.join(skillTests, "trigger_evals.json");
  fs.writeFileSync(triggerPath, "[]\n");
  const result = runValidator([
    "--skill", "patent-disclosure",
    "--skills-root", skillsRoot,
    "--tests-root", testsRoot,
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must contain exactly 20 queries/);
}));
