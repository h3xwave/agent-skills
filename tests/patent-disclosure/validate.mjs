import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  Validation,
  listFiles,
  parseFrontmatter,
  printValidation,
  readText,
  validateContractCases,
  validateMarkdownLinks,
  validateOpenAiAgent,
} from "../lib/validation.mjs";

const ALLOWED_FRONTMATTER = new Set(["name", "description"]);
const EXPECTED_TOP_LEVEL = new Set(["SKILL.md", "agents", "rules", "workflows", "references", "templates", "scripts"]);
const ROUTED_DIRS = ["rules", "workflows", "references", "templates"];
const FORBIDDEN_NAMES = new Set(["README.md", "README.zh-CN.md", "CHANGELOG.md", "behavior_cases.json", "evals.json", "trigger_evals.json", "validate.py", "validate.mjs"]);
const NUMERIC_PERCENT = /(?:重合|过审|授权|通过)[^\n]{0,30}\b\d{1,3}\s*%/i;

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function validateFrontmatter(skillDir, validation) {
  const skillFile = path.join(skillDir, "SKILL.md");
  validation.require(fs.existsSync(skillFile), `missing required file: ${skillFile}`);
  if (!fs.existsSync(skillFile)) {
    return;
  }
  const parsed = parseFrontmatter(readText(skillFile));
  for (const error of parsed.errors) {
    validation.require(false, `invalid SKILL.md frontmatter: ${error}`);
  }
  const keys = new Set(parsed.keys);
  validation.require(
    sameSet(keys, ALLOWED_FRONTMATTER),
    `frontmatter keys must be exactly ${JSON.stringify([...ALLOWED_FRONTMATTER].sort())}; got ${JSON.stringify(parsed.keys)}`,
  );
  validation.require(parsed.body.split("\n").length <= 90, `SKILL.md body exceeds 90 lines: ${parsed.body.split("\n").length}`);
  const description = String(parsed.data?.description ?? "");
  for (const term of ["不承诺生成可直接提交的", "不用于侵权/FTO 分析"]) {
    validation.require(description.includes(term), `description boundary is missing: ${term}`);
  }
}

function validateLayoutAndRouting(skillDir, validation) {
  const actual = new Set(fs.readdirSync(skillDir));
  validation.require(
    sameSet(actual, EXPECTED_TOP_LEVEL),
    `top-level entries must be exactly ${JSON.stringify([...EXPECTED_TOP_LEVEL].sort())}; got ${JSON.stringify([...actual].sort())}`,
  );
  for (const entry of listFiles(skillDir, { includeDirectories: true })) {
    validation.require(
      !FORBIDDEN_NAMES.has(path.basename(entry.absolute)) && !entry.relative.endsWith(".pyc") && !entry.relative.includes("__pycache__"),
      `skill contains repository-only/generated artifact: ${entry.relative}`,
    );
  }

  const skillText = readText(path.join(skillDir, "SKILL.md"));
  for (const directory of ROUTED_DIRS) {
    for (const entry of listFiles(path.join(skillDir, directory))) {
      const relative = `${directory}/${entry.relative}`;
      validation.require(skillText.includes(relative), `file lacks a direct task route in SKILL.md: ${relative}`);
    }
  }
  validation.require(skillText.includes("scripts/generate_docx.py"), "export script lacks a direct task route");
  validateMarkdownLinks(skillDir, validation);
}

function validateModesAndSearch(skillDir, validation) {
  const skill = readText(path.join(skillDir, "SKILL.md"));
  const core = readText(path.join(skillDir, "rules", "core-rules.md"));
  const search = readText(path.join(skillDir, "rules", "search-and-confidentiality.md"));
  const strategy = readText(path.join(skillDir, "references", "search_strategy.md"));
  const assessment = readText(path.join(skillDir, "references", "analysis_framework.md"));
  const interview = readText(path.join(skillDir, "workflows", "interview.md"));

  for (const term of ["### 快速模式", "### 完整模式", "直接执行 `scripts/generate_docx.py`，无需先读取源码"]) {
    validation.require(skill.includes(term), `SKILL mode/routing contract is missing: ${term}`);
  }
  for (const term of ["快速模式不以公开风险询问、联网检索或预判报告作为强制前置条件", "每轮最多提出 3 个影响最大的缺口问题"]) {
    validation.require(core.includes(term), `core mode contract is missing: ${term}`);
  }
  validation.require(search.includes("不设置“近几年”的下限"), "prior-art search must not have an arbitrary recent lower bound");
  validation.require(strategy.includes("不设近年下限"), "search strategy must cover historical prior art");
  validation.require(strategy.includes("不要把趋势检索的近期窗口用于现有技术检索"), "recent discovery window must not constrain prior-art search");
  for (const term of ["## 二、风险等级", "## 三、检索覆盖度与结论置信度", "## 四、未知项清单"]) {
    validation.require(assessment.includes(term), `qualitative risk framework is missing: ${term}`);
  }
  validation.require(interview.includes("不机械执行固定四轮"), "interview must be adaptive rather than fixed-round");

  const corpus = listFiles(skillDir)
    .filter((entry) => entry.relative.endsWith(".md") || entry.relative.endsWith(".csv"))
    .map((entry) => readText(entry.absolute))
    .join("\n");
  validation.require(!NUMERIC_PERCENT.test(corpus), "fixed overlap/grant percentage found in installable content");
  for (const phrase of ["重合（≥80%）", "40%–80%", "无冲突 | 85%", "每轮必须按顺序", "不得随意增删章节"]) {
    validation.require(!corpus.includes(phrase), `obsolete rigid contract found: ${phrase}`);
  }
}

export function validateSkill(skillDir, { casesPath } = {}) {
  const validation = new Validation();
  validation.require(fs.existsSync(skillDir) && fs.statSync(skillDir).isDirectory(), `source skill directory does not exist: ${skillDir}`);
  if (!fs.existsSync(skillDir) || !fs.statSync(skillDir).isDirectory()) {
    return validation;
  }
  validateFrontmatter(skillDir, validation);
  validateLayoutAndRouting(skillDir, validation);
  validateModesAndSearch(skillDir, validation);
  validateOpenAiAgent(skillDir, "patent-disclosure", validation);
  const defaultCases = path.join(path.dirname(fileURLToPath(import.meta.url)), "behavior_cases.json");
  validateContractCases(skillDir, casesPath ?? defaultCases, validation);
  const docxSmoke = path.join(path.dirname(fileURLToPath(import.meta.url)), "test_generate_docx.py");
  validation.require(fs.existsSync(docxSmoke), `missing DOCX smoke test: ${docxSmoke}`);
  return validation;
}

async function cli() {
  const skillDir = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "skills", "patent-disclosure"));
  const validation = validateSkill(skillDir);
  process.exitCode = printValidation(validation, "PASS: {checks} static and contract checks") ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await cli();
}
