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
const EXPECTED_TOP_LEVEL = new Set(["SKILL.md", "agents", "references"]);
const LEGACY_FILES = new Set([
  "references/photorealism.md",
  "references/platform-notes.md",
  "references/reference-image-contract.md",
  "references/style-dimensions.md",
  "references/visual-trends.md",
]);
const REQUIRED_FILES = new Set([
  "references/photography-framework.md",
  "references/photography-templates.md",
  "references/non-photographic-templates.md",
  "references/reference-image-workflow.md",
  "references/platforms/midjourney.md",
  "references/platforms/gpt-image.md",
  "references/platforms/nano-banana.md",
  "references/platforms/flux.md",
  "references/platforms/stable-diffusion.md",
]);
const PLATFORM_FILES = [...REQUIRED_FILES].filter((entry) => entry.startsWith("references/platforms/")).sort();
const REFERENCE_PLACEHOLDER = "[在此处替换为您想要生成的主体内容]";

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
  validation.require(
    String(parsed.data?.description ?? "").includes("use imagegen instead"),
    "description must hand direct image generation/editing to imagegen",
  );
}

function validateLayoutAndRouting(skillDir, validation) {
  const actual = new Set(fs.readdirSync(skillDir));
  validation.require(
    sameSet(actual, EXPECTED_TOP_LEVEL),
    `top-level entries must be exactly ${JSON.stringify([...EXPECTED_TOP_LEVEL].sort())}; got ${JSON.stringify([...actual].sort())}`,
  );
  for (const relative of [...REQUIRED_FILES].sort()) {
    validation.require(fs.existsSync(path.join(skillDir, relative)), `missing required resource: ${relative}`);
  }
  for (const relative of [...LEGACY_FILES].sort()) {
    validation.require(!fs.existsSync(path.join(skillDir, relative)), `legacy resource must be removed: ${relative}`);
  }

  const skillText = readText(path.join(skillDir, "SKILL.md"));
  for (const reference of listFiles(path.join(skillDir, "references")).filter((entry) => entry.relative.endsWith(".md"))) {
    const relative = `references/${reference.relative}`;
    validation.require(skillText.includes(relative), `reference lacks a direct SKILL.md task route: ${relative}`);
  }
  validateMarkdownLinks(skillDir, validation);
}

function validateSingleAuthorityAndTemplates(skillDir, validation) {
  const photography = readText(path.join(skillDir, "references", "photography-framework.md"));
  for (const term of ["## 摄影三轨", "## 真实感锚点预算", "## 成像修饰器", "## 可解释的主导光源"]) {
    validation.require(photography.includes(term), `photography authority is missing: ${term}`);
  }

  for (const relative of ["references/photography-templates.md", "references/non-photographic-templates.md"]) {
    const lineCount = readText(path.join(skillDir, relative)).split(/\r?\n/).length;
    validation.require(lineCount <= 90, `template exceeds 90 lines: ${relative} (${lineCount})`);
  }

  const nonPhoto = readText(path.join(skillDir, "references", "non-photographic-templates.md"));
  const fencedTemplates = [...nonPhoto.matchAll(/```(?:text)?\s*\n(.*?)```/gis)].map((match) => match[1]).join("\n");
  for (const pattern of [
    /\b(?:16|24|28|35|50|70|85|100|135)\s*mm\b/i,
    /\bf\s*\/?\s*\d(?:\.\d+)?\b/i,
    /摄影景深|相机型号/i,
  ]) {
    validation.require(!pattern.test(fencedTemplates), `photography language leaked into non-photo templates: ${pattern}`);
  }
}

function validateReferenceWorkflow(skillDir, validation) {
  const workflow = readText(path.join(skillDir, "references", "reference-image-workflow.md"));
  validation.require(
    workflow.split(REFERENCE_PLACEHOLDER).length - 1 === 1,
    "reference workflow must contain the subject placeholder exactly once",
  );
  for (const term of [
    "风格分析",
    "可替换主体模板",
    "具体主体完整 Prompt",
    "不得默认把“分析”改成纯 Prompt",
    "用户明确指定的新主体、自有角色、品牌、Logo、文案",
  ]) {
    validation.require(workflow.includes(term), `reference workflow is missing contract evidence: ${term}`);
  }
}

function validatePlatformFiles(skillDir, validation) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const relative of PLATFORM_FILES) {
    const text = readText(path.join(skillDir, relative));
    const match = text.match(/^Last verified:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
    validation.require(Boolean(match), `platform file lacks Last verified YYYY-MM-DD: ${relative}`);
    validation.require(
      text.includes("https://") && (text.includes("Official") || text.includes("Canonical")),
      `platform file lacks official/canonical source links: ${relative}`,
    );
    if (match) {
      const [year, month, day] = match[1].split("-").map(Number);
      const verified = Date.UTC(year, month - 1, day);
      const parsedDate = new Date(verified);
      const exactDate = parsedDate.getUTCFullYear() === year
        && parsedDate.getUTCMonth() === month - 1
        && parsedDate.getUTCDate() === day;
      validation.require(exactDate, `platform verification date is invalid: ${relative} (${match[1]})`);
      if (exactDate) {
        validation.require(verified <= todayUtc, `platform verification date is in the future: ${relative} (${match[1]})`);
        if ((todayUtc - verified) / 86_400_000 > 90) {
          validation.warn(`platform snapshot is older than 90 days: ${relative} (${match[1]})`);
        }
      }
    }
  }

  const midjourney = readText(path.join(skillDir, "references", "platforms", "midjourney.md"));
  for (const term of ["`--raw`", "Omni Reference", "`--oref <URL>`"]) {
    validation.require(midjourney.includes(term), `Midjourney notes are missing: ${term}`);
  }
  const flux = readText(path.join(skillDir, "references", "platforms", "flux.md"));
  validation.require(flux.includes("不要输出独立 negative prompt"), "FLUX notes must forbid an independent negative prompt");
  const stable = readText(path.join(skillDir, "references", "platforms", "stable-diffusion.md"));
  for (const term of ["独立 negative prompt", "ControlNet", "IP-Adapter"]) {
    validation.require(stable.includes(term), `Stable Diffusion notes are missing: ${term}`);
  }
}

function validateStalePhrasing(skillDir, validation) {
  const corpus = listFiles(skillDir)
    .filter((entry) => entry.relative.endsWith(".md"))
    .map((entry) => readText(entry.absolute))
    .join("\n");
  validation.require(!corpus.includes("--style raw"), "obsolete Midjourney syntax found: --style raw");
  for (const line of corpus.split(/\r?\n/)) {
    if (/DALL[·.-]?E/i.test(line) && /推荐|首选|默认/.test(line)) {
      validation.require(
        ["不再推荐", "不推荐", "不作为", "deprecated"].some((marker) => line.includes(marker)),
        `DALL·E appears recommended: ${line.trim()}`,
      );
    }
  }
  for (const marker of ["FLUX 使用 negative prompt", "FLUX 支持 negative prompt", "FLUX 负向提示词："]) {
    validation.require(!corpus.includes(marker), `FLUX must not receive a negative prompt: ${marker}`);
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
  validateSingleAuthorityAndTemplates(skillDir, validation);
  validateReferenceWorkflow(skillDir, validation);
  validatePlatformFiles(skillDir, validation);
  validateStalePhrasing(skillDir, validation);
  validateOpenAiAgent(skillDir, "design-image-prompt-engineer", validation);
  const defaultCases = path.join(path.dirname(fileURLToPath(import.meta.url)), "behavior_cases.json");
  validateContractCases(skillDir, casesPath ?? defaultCases, validation);
  return validation;
}

async function cli() {
  const skillDir = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "skills", "design-image-prompt-engineer"));
  const validation = validateSkill(skillDir);
  process.exitCode = printValidation(validation, "PASS: {checks} static and contract checks") ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await cli();
}
